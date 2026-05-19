import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data } = await supabase
    .from("project_members")
    .select("*, users(id, full_name, email)")
    .eq("project_id", id)
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ members: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ message: "user_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("project_members")
    .upsert({ project_id: id, user_id, business_id: session.businessId }, { onConflict: "project_id,user_id" })
    .select("*, users(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
