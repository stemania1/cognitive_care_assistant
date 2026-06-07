import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  formatMessengerError,
  isMessengerContactsTableMissing,
  isSupabaseNetworkError,
  MESSENGER_CONTACTS_SETUP_MESSAGE,
  type MessengerContact,
} from "@/lib/messenger-table";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function apiError(error: unknown, status = 500) {
  return NextResponse.json({ error: formatMessengerError(error) }, { status });
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        {
          data: [] as MessengerContact[],
          error: formatMessengerError(adminError?.details || adminError?.message),
          offlineFallback: true,
        },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("messenger_contacts")
      .select("*")
      .eq("owner_user_id", userId)
      .order("contact_display_name", { ascending: true });

    if (error) {
      if (isMessengerContactsTableMissing(error)) {
        return NextResponse.json({
          data: [] as MessengerContact[],
          warning: "messenger_contacts table not created yet",
          setupMessage: MESSENGER_CONTACTS_SETUP_MESSAGE,
          offlineFallback: true,
        });
      }
      if (isSupabaseNetworkError(error.message)) {
        return NextResponse.json({
          data: [] as MessengerContact[],
          error: formatMessengerError(error),
          offlineFallback: true,
        });
      }
      return apiError(error.message);
    }

    return NextResponse.json({ data: (data || []) as MessengerContact[] });
  } catch (e) {
    console.error("messenger contacts GET:", e);
    return NextResponse.json({
      data: [] as MessengerContact[],
      error: formatMessengerError(e),
      offlineFallback: true,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const contactUserId =
      typeof body.contactUserId === "string" ? body.contactUserId.trim() : "";
    const contactDisplayName =
      typeof body.contactDisplayName === "string"
        ? body.contactDisplayName.trim().slice(0, 80)
        : "";

    if (!contactUserId) {
      return NextResponse.json({ error: "Contact user ID is required" }, { status: 400 });
    }

    if (!contactDisplayName) {
      return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    }

    if (contactUserId === userId) {
      return NextResponse.json({ error: "You cannot add yourself as a contact" }, { status: 400 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        {
          error: formatMessengerError(adminError?.details || adminError?.message),
          offlineFallback: true,
        },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("messenger_contacts")
      .upsert(
        {
          owner_user_id: userId,
          contact_user_id: contactUserId,
          contact_display_name: contactDisplayName,
        },
        { onConflict: "owner_user_id,contact_user_id" }
      )
      .select("*")
      .single();

    if (error) {
      if (isMessengerContactsTableMissing(error)) {
        return NextResponse.json(
          {
            error: MESSENGER_CONTACTS_SETUP_MESSAGE,
            offlineFallback: true,
          },
          { status: 503 }
        );
      }
      return apiError(error.message);
    }

    return NextResponse.json({ data: data as MessengerContact });
  } catch (e) {
    console.error("messenger contacts POST:", e);
    return apiError(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const contactUserId = request.nextUrl.searchParams.get("contactUserId");
    if (!contactUserId) {
      return NextResponse.json({ error: "contactUserId is required" }, { status: 400 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        { error: formatMessengerError(adminError?.details || adminError?.message), offlineFallback: true },
        { status: 503 }
      );
    }

    const { error } = await supabaseAdmin
      .from("messenger_contacts")
      .delete()
      .eq("owner_user_id", userId)
      .eq("contact_user_id", contactUserId);

    if (error) {
      if (isMessengerContactsTableMissing(error)) {
        return NextResponse.json({ ok: true, offlineFallback: true });
      }
      return apiError(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("messenger contacts DELETE:", e);
    return apiError(e);
  }
}
