import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return NextResponse.json({ subscription: data ?? null });
}
