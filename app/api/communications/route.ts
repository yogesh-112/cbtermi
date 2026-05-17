import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { contact_id, channel, message, subject } = await request.json();
  if (!contact_id || !message?.trim()) return NextResponse.json({ message: "contact_id and message are required" }, { status: 400 });

  const { data, error } = await supabase.from("communication_logs").insert({
    business_id: session.businessId,
    contact_id,
    channel: channel ?? "email",
    subject: subject ?? null,
    message: message.trim(),
    type: "outbound",
    sent_by: session.id,
    status: "sent",
  }).select("*, contacts(full_name)").single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (channel === "whatsapp") {
    const { data: contact } = await supabase.from("contacts").select("whatsapp, phone").eq("id", contact_id).single();
    const phone = (contact?.whatsapp || contact?.phone || "").replace(/\D/g, "");
    return NextResponse.json({ log: data, link: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` });
  }

  if (channel === "sms") {
    const { data: contact } = await supabase.from("contacts").select("phone").eq("id", contact_id).single();
    const phone = (contact?.phone || "").replace(/\D/g, "");
    return NextResponse.json({ log: data, link: `sms:+${phone}?body=${encodeURIComponent(message)}` });
  }

  return NextResponse.json({ log: data });
}
