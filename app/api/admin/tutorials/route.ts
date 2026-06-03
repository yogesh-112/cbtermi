import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("tutorial_videos")
    .select("*")
    .order("sort_order");
  return NextResponse.json({ tutorials: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ message: "Title required" }, { status: 400 });
  if (!body.topic?.trim()) return NextResponse.json({ message: "Topic required" }, { status: 400 });

  const { data: tutorial, error } = await supabase
    .from("tutorial_videos")
    .insert({
      title:      body.title.trim(),
      topic:      body.topic.trim(),
      duration:   body.duration?.trim() || null,
      youtube_id: body.youtube_id?.trim() || "",
      sort_order: body.sort_order ?? 99,
      is_active:  body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ tutorial }, { status: 201 });
}
