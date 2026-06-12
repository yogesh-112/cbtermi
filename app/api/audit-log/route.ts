import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Audit log is owner/admin only
  let userRole = session.role;
  if (!userRole) {
    const { data: member } = await supabase.from("business_members").select("role").eq("user_id", session.id).eq("business_id", session.businessId).single();
    userRole = member?.role;
  }
  if (!["owner", "admin"].includes(userRole ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can view the audit log." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("audit_events")
    .select("*, users(full_name)")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
