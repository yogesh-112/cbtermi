import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: link } = await supabase
    .from("booking_links")
    .select("*, contacts(id, full_name, email, phone), booking_link_slots(slot_id, scheduling_slots(*))")
    .eq("token", token)
    .eq("status", "active")
    .single();

  if (!link) return NextResponse.json({ message: "Booking link not found or expired" }, { status: 404 });

  if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
    await supabase.from("booking_links").update({ status: "expired" }).eq("id", link.id);
    return NextResponse.json({ message: "This booking link has expired" }, { status: 410 });
  }

  const { data: biz } = await supabase
    .from("businesses")
    .select("name, phone, email")
    .eq("id", link.business_id)
    .single();

  const availableSlots = (link.booking_link_slots ?? [])
    .map((bls: any) => bls.scheduling_slots)
    .filter((s: any) => s && s.status === "available")
    .sort((a: any, b: any) => {
      const da = new Date(a.slot_date + (a.start_time ? "T" + a.start_time : "T00:00"));
      const db = new Date(b.slot_date + (b.start_time ? "T" + b.start_time : "T00:00"));
      return da.getTime() - db.getTime();
    });

  return NextResponse.json({
    link: {
      id: link.id,
      title: link.title,
      purpose: link.purpose,
      message_to_recipient: link.message_to_recipient,
      contact: link.contacts ?? null,
    },
    business: biz ?? { name: "Clear Build USA" },
    slots: availableSlots,
  });
}
