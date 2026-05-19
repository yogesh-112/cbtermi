import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id, memberId } = await params;

  await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", id)
    .eq("business_id", session.businessId);

  return NextResponse.json({ message: "Removed" });
}
