import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Public endpoint — no auth required (tutorials are public content)
export async function GET() {
  const { data } = await supabase
    .from("tutorial_videos")
    .select("id, title, topic, duration, youtube_id, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  return NextResponse.json({ tutorials: data ?? [] });
}
