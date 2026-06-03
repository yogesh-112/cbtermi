import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const sp       = request.nextUrl.searchParams;
  const category = sp.get("category");
  const search   = sp.get("search");
  const lang     = sp.get("lang") || "en";

  if (search && search.length > 200) return NextResponse.json({ faqs: [] });

  // Try requested language first, then fall back to English
  const langs = lang !== "en" ? [lang, "en"] : ["en"];

  let q = supabase
    .from("help_faqs")
    .select("*")
    .eq("is_active", true)
    .in("language", langs)
    .order("language") // 'en' sorts before others so fallback works
    .order("category")
    .order("sort_order");

  if (category) q = q.eq("category", category);
  if (search) q = q.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ faqs: [] });

  // De-duplicate: prefer requested language over English fallback
  const seen = new Set<string>();
  const deduped = (data ?? []).filter((faq: any) => {
    const key = `${faq.category}__${faq.sort_order}`;
    // If requested language variant exists, use it; skip the English fallback
    if (lang !== "en" && faq.language === lang) { seen.add(key); return true; }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ faqs: deduped });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.question || !body.answer || !body.category) {
    return NextResponse.json({ message: "question, answer, and category are required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("help_faqs").insert({
    question:   body.question,
    answer:     body.answer,
    category:   body.category,
    language:   body.language ?? "en",
    sort_order: body.sort_order ?? 99,
    is_active:  body.is_active ?? true,
  }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ faq: data }, { status: 201 });
}
