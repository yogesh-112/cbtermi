import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id, taskId } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("project_tasks")
    .update({ done: body.done })
    .eq("id", taskId)
    .eq("project_id", id)
    .eq("business_id", session.businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id, taskId } = await params;

  await supabase
    .from("project_tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", id)
    .eq("business_id", session.businessId);

  return NextResponse.json({ message: "Deleted" });
}
