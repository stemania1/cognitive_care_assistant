import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  formatMessengerError,
  isMessageTypeColumnMissing,
  isMessengerTableMissing,
  isRecipientColumnMissing,
  isSupabaseNetworkError,
  MESSENGER_TABLE_SETUP_MESSAGE,
  normalizeMessageType,
  type MessengerMessage,
} from "@/lib/messenger-table";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const MAX_MESSAGE_LENGTH = 2000;
const MESSAGE_LIMIT = 200;

function apiError(error: unknown, status = 500) {
  const message = formatMessengerError(error);
  return NextResponse.json(
    {
      error: message,
      code: isSupabaseNetworkError(message) ? "SUPABASE_NETWORK" : undefined,
    },
    { status }
  );
}

function normalizeRows(data: MessengerMessage[] | null): MessengerMessage[] {
  return (data || []).map((row) => ({
    ...row,
    message_type: normalizeMessageType(row.message_type),
    recipient_user_id: row.recipient_user_id ?? null,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const contactUserId = request.nextUrl.searchParams.get("contactUserId");
    if (!contactUserId) {
      return NextResponse.json({ error: "contactUserId query parameter is required" }, { status: 400 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return apiError(adminError?.details || adminError?.message || "Service role key not configured");
    }

    const threadFilter = `and(user_id.eq.${userId},recipient_user_id.eq.${contactUserId}),and(user_id.eq.${contactUserId},recipient_user_id.eq.${userId})`;

    let usedLegacyQuery = false;
    let { data, error } = await supabaseAdmin
      .from("messenger_messages")
      .select("*")
      .or(threadFilter)
      .order("created_at", { ascending: true })
      .limit(MESSAGE_LIMIT);

    if (error && isRecipientColumnMissing(error)) {
      usedLegacyQuery = true;
      ({ data, error } = await supabaseAdmin
        .from("messenger_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(0));
    }

    if (error) {
      if (isMessengerTableMissing(error)) {
        return NextResponse.json({
          data: [] as MessengerMessage[],
          warning: "messenger_messages table not created yet",
          setupMessage: MESSENGER_TABLE_SETUP_MESSAGE,
          offlineFallback: true,
        });
      }
      if (isSupabaseNetworkError(error.message)) {
        return NextResponse.json({
          data: [] as MessengerMessage[],
          error: formatMessengerError(error),
          code: "SUPABASE_NETWORK",
          offlineFallback: true,
        });
      }
      return apiError(error.message);
    }

    const rows = normalizeRows(data as MessengerMessage[]);
    if (usedLegacyQuery) {
      return NextResponse.json({
        data: [] as MessengerMessage[],
        setupMessage:
          "Run supabase/migrations/019_messenger_contacts_and_recipient.sql to enable direct messages.",
        offlineFallback: true,
      });
    }

    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error("messenger GET:", e);
    if (isSupabaseNetworkError(e instanceof Error ? e.message : String(e))) {
      return NextResponse.json({
        data: [] as MessengerMessage[],
        error: formatMessengerError(e),
        code: "SUPABASE_NETWORK",
        offlineFallback: true,
      });
    }
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : "User";
    const messageType = normalizeMessageType(body.messageType);
    const recipientUserId =
      typeof body.recipientUserId === "string" ? body.recipientUserId.trim() : "";

    if (!recipientUserId) {
      return NextResponse.json({ error: "recipientUserId is required" }, { status: 400 });
    }

    if (recipientUserId === userId) {
      return NextResponse.json({ error: "Cannot send a message to yourself" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        {
          error: formatMessengerError(adminError?.details || adminError?.message),
          code: "SUPABASE_NETWORK",
          offlineFallback: true,
        },
        { status: 503 }
      );
    }

    const baseRow = {
      user_id: userId,
      display_name: displayName || "User",
      content,
      recipient_user_id: recipientUserId,
    };

    let result = await supabaseAdmin
      .from("messenger_messages")
      .insert({ ...baseRow, message_type: messageType })
      .select("*")
      .single();

    if (result.error && isMessageTypeColumnMissing(result.error)) {
      result = await supabaseAdmin.from("messenger_messages").insert(baseRow).select("*").single();
    }

    if (result.error && isRecipientColumnMissing(result.error)) {
      const { message_type: _omit, recipient_user_id: _omit2, ...legacyRow } = {
        ...baseRow,
        message_type: messageType,
      };
      result = await supabaseAdmin
        .from("messenger_messages")
        .insert({
          user_id: legacyRow.user_id,
          display_name: legacyRow.display_name,
          content: legacyRow.content,
          message_type: messageType,
        })
        .select("*")
        .single();
    }

    const { data, error } = result;

    if (error) {
      if (isMessengerTableMissing(error)) {
        return NextResponse.json(
          {
            error: MESSENGER_TABLE_SETUP_MESSAGE,
            code: "MESSENGER_TABLE_MISSING",
            offlineFallback: true,
          },
          { status: 503 }
        );
      }
      if (isSupabaseNetworkError(error.message)) {
        return NextResponse.json(
          {
            error: formatMessengerError(error),
            code: "SUPABASE_NETWORK",
            offlineFallback: true,
          },
          { status: 503 }
        );
      }
      return apiError(error.message);
    }

    const row = {
      ...(data as MessengerMessage),
      message_type: normalizeMessageType((data as MessengerMessage).message_type ?? messageType),
      recipient_user_id:
        (data as MessengerMessage).recipient_user_id ?? recipientUserId,
    };

    return NextResponse.json({ data: row });
  } catch (e) {
    console.error("messenger POST:", e);
    if (isSupabaseNetworkError(e instanceof Error ? e.message : String(e))) {
      return NextResponse.json(
        {
          error: formatMessengerError(e),
          code: "SUPABASE_NETWORK",
          offlineFallback: true,
        },
        { status: 503 }
      );
    }
    return apiError(e);
  }
}
