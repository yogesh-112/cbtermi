import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title      !== undefined) updates.title      = body.title?.trim();
  if (body.topic      !== undefined) updates.topic      = body.topic?.trim();
  if (body.duration   !== undefined) updates.duration   = body.duration?.trim() || null;
  if (body.youtube_id !== undefined) updates.youtube_id = body.youtube_id?.trim() || "";
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.is_active  !== undefined) updates.is_active  = body.is_active;

  const { data: tutorial, error } = await supabase
    .from("tutorial_videos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ tutorial });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await supabase.from("tutorial_videos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
