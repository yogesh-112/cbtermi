import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("help_faqs")
    .select("*")
    .order("category")
    .order("language")
    .order("sort_order");

  return NextResponse.json({ faqs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { question, answer, category, language, sort_order } = body;
  if (!question || !answer || !category) return NextResponse.json({ message: "question, answer, category required" }, { status: 400 });

  const { data, error } = await supabase.from("help_faqs").insert({
    question, answer, category,
    language:   language ?? "en",
    sort_order: sort_order ?? 99,
    is_active:  true,
  }).select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ faq: data }, { status: 201 });
}
