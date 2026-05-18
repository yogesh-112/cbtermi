import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  let q = supabase
    .from("scheduled_meetings")
    .select("*, scheduling_slots(*), contacts(id, full_name, email, phone), booking_links(title, token)")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const { data } = await q;
  return NextResponse.json({ meetings: data ?? [] });
}
