import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", id)
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { label } = await request.json();
  if (!label?.trim()) return NextResponse.json({ message: "Label required" }, { status: 400 });

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({ project_id: id, business_id: session.businessId, label: label.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
