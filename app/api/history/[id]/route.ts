
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const token = await getToken();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      accessToken: async () => token,
    });

    // Find only a history item owned by the signed-in user.
    const { data: item, error: lookupError } = await supabase
      .from("image_history")
      .select("id, result_storage_path")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: "Could not find the history item." },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: "History item not found." },
        { status: 404 }
      );
    }

    // Delete the stored image first, if one exists.
    if (item.result_storage_path) {
      const { error: storageError } = await supabase.storage
        .from("kraz-images")
        .remove([item.result_storage_path]);

      if (storageError) {
        return NextResponse.json(
          { error: "Could not delete the stored image." },
          { status: 500 }
        );
      }
    }

    // Delete the history record.
    const { error: deleteError } = await supabase
      .from("image_history")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Image deleted, but its history record could not be deleted." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
