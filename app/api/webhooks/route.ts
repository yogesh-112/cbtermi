import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("webhook_configs").select("id, url, events, is_active, created_at").eq("business_id", session.businessId).order("created_at", { ascending: false });
  return NextResponse.json({ webhooks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { url, events } = await request.json();
  if (!url || !url.startsWith("https://")) return NextResponse.json({ message: "URL must start with https://" }, { status: 400 });

  const secret = "whsec_" + randomBytes(24).toString("hex");
  const { data, error } = await supabase.from("webhook_configs").insert({
    business_id: session.businessId, url, events: events ?? [], secret, is_active: true,
  }).select("id, url, events, is_active, created_at").single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ webhook: data, secret }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  await supabase.from("webhook_configs").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
