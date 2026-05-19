import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("search");
  if (search && search.length > 200) return NextResponse.json({ faqs: [] });

  let q = supabase
    .from("help_faqs")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");

  if (category) q = q.eq("category", category);
  if (search) q = q.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ faqs: [] });
  return NextResponse.json({ faqs: data ?? [] });
}
