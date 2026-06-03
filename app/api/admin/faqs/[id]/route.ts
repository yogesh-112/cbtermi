import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.question   !== undefined) updates.question   = body.question;
  if (body.answer     !== undefined) updates.answer     = body.answer;
  if (body.category   !== undefined) updates.category   = body.category;
  if (body.language   !== undefined) updates.language   = body.language;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.is_active  !== undefined) updates.is_active  = body.is_active;
  const { data, error } = await supabase.from("help_faqs").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ faq: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await supabase.from("help_faqs").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
