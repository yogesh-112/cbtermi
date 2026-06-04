import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await supabase
    .from("feedback")
    .select("id, status, businesses(name), contacts(full_name), projects(name)")
    .eq("token", token).single();
  if (!data) return NextResponse.json({ message: "Invalid link" }, { status: 404 });
  return NextResponse.json({ feedback: data });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { rating, message, category } = await request.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ message: "Rating 1–5 required" }, { status: 400 });

  const { data: fb } = await supabase.from("feedback").select("id, status").eq("token", token).single();
  if (!fb) return NextResponse.json({ message: "Invalid link" }, { status: 404 });
  if (fb.status === "received") return NextResponse.json({ message: "Feedback already submitted" }, { status: 409 });

  const { error } = await supabase.from("feedback").update({
    rating, message: message?.trim() || null, category: category || "general",
    status: "received", responded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", fb.id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "Thank you for your feedback!" });
}
