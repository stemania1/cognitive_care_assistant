import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  ALBUM_TABLE_SETUP_MESSAGE,
  isAlbumPhotosTableMissing,
} from "@/lib/album-photos-table";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const TABLE_MISSING_BODY = {
  error: ALBUM_TABLE_SETUP_MESSAGE,
  code: "ALBUM_TABLE_MISSING" as const,
};

export async function GET(request: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId || userId !== authenticatedUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        { error: adminError?.message || "Service role key not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("album_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isAlbumPhotosTableMissing(error)) {
        return NextResponse.json({
          data: [],
          warning: "album_photos table not created yet",
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (e) {
    console.error("album-photos GET:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, photoUrl, photoType } = body as {
      userId?: string;
      photoUrl?: string;
      photoType?: string;
    };

    if (!userId || !photoUrl || !photoType) {
      return NextResponse.json({ error: "userId, photoUrl, and photoType are required" }, { status: 400 });
    }

    if (userId !== authenticatedUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        { error: adminError?.message || "Service role key not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("album_photos")
      .insert({
        user_id: userId,
        photo_url: photoUrl,
        photo_type: photoType,
      })
      .select()
      .single();

    if (error) {
      console.error("album_photos insert:", error);
      if (isAlbumPhotosTableMissing(error)) {
        return NextResponse.json(TABLE_MISSING_BODY, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error("album-photos POST:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    const userId = request.nextUrl.searchParams.get("userId");
    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 });
    }
    if (userId !== authenticatedUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json(
        { error: adminError?.message || "Service role key not configured" },
        { status: 500 }
      );
    }

    const { data: row, error: fetchError } = await supabaseAdmin
      .from("album_photos")
      .select("photo_url")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (isAlbumPhotosTableMissing(fetchError)) {
        return NextResponse.json(TABLE_MISSING_BODY, { status: 503 });
      }
    }
    if (fetchError || !row) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (row.photo_url) {
      try {
        const url = new URL(row.photo_url);
        const pathParts = url.pathname.split("/");
        const bucketIndex = pathParts.findIndex((p) => p === "daily-check-photos");
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/");
          await supabaseAdmin.storage.from("daily-check-photos").remove([filePath]);
        }
      } catch {
        /* continue */
      }
    }

    const { error: delError } = await supabaseAdmin.from("album_photos").delete().eq("id", id).eq("user_id", userId);

    if (delError) {
      if (isAlbumPhotosTableMissing(delError)) {
        return NextResponse.json(TABLE_MISSING_BODY, { status: 503 });
      }
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("album-photos DELETE:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
