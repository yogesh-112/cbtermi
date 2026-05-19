import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("item_requirement_lists").select("*, projects(name), contacts(full_name), item_requirements(*)").eq("business_id", session.businessId).order("created_at", { ascending: false });
  return NextResponse.json({ lists: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { items, ...body } = await request.json();
  const { data: list, error } = await supabase.from("item_requirement_lists").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (items?.length) {
    const { error: itemsErr } = await supabase.from("item_requirements").insert(items.map((i: any, idx: number) => ({ ...i, list_id: list.id, sort_order: idx })));
    if (itemsErr) console.error("[item-requirements] item_requirements insert failed:", itemsErr.message);
  }
  return NextResponse.json({ list }, { status: 201 });
}
