import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("communication_logs")
    .select("*, contacts(full_name)")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .limit(500);
  return NextResponse.json({ logs: data ?? [] });
}
