import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();

  if (!body.slot_id) return NextResponse.json({ message: "Slot is required" }, { status: 400 });

  const { data: link } = await supabase
    .from("booking_links")
    .select("*, contacts(id, full_name, email, phone)")
    .eq("token", token)
    .eq("status", "active")
    .single();

  if (!link) return NextResponse.json({ message: "Booking link not found" }, { status: 404 });

  const { data: slot } = await supabase
    .from("scheduling_slots")
    .select("*")
    .eq("id", body.slot_id)
    .eq("status", "available")
    .single();

  if (!slot) return NextResponse.json({ message: "This slot is no longer available" }, { status: 409 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("name, email, phone")
    .eq("id", link.business_id)
    .single();

  const guestName = link.contacts?.full_name ?? body.guest_name;
  const guestEmail = link.contacts?.email ?? body.guest_email;
  const guestPhone = link.contacts?.phone ?? body.guest_phone;

  if (!guestName) return NextResponse.json({ message: "Name is required" }, { status: 400 });
  if (!guestEmail) return NextResponse.json({ message: "Email is required" }, { status: 400 });

  const { data: meeting, error } = await supabase
    .from("scheduled_meetings")
    .insert({
      business_id: link.business_id,
      booking_link_id: link.id,
      slot_id: slot.id,
      contact_id: link.contact_id ?? null,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone ?? null,
      guest_message: body.guest_message ?? null,
      purpose: link.purpose,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to book meeting" }, { status: 500 });

  await supabase
    .from("scheduling_slots")
    .update({ status: "booked", updated_at: new Date().toISOString() })
    .eq("id", slot.id);

  const bizName = biz?.name ?? "Clear Build USA";
  const dateStr = slot.slot_date;
  const timeStr = slot.start_time ? ` at ${slot.start_time}` : "";
  const purposeStr = link.purpose ?? "Meeting";

  const guestHtml = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#123B5D;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">${bizName}</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">Hi ${guestName},</p>
        <p style="color:#475569">Your meeting has been scheduled with <strong>${bizName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:6px;overflow:hidden">
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px">Purpose</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right">${purposeStr}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Date</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${dateStr}${timeStr}</td></tr>
          ${slot.location ? `<tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Location</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${slot.location}</td></tr>` : ""}
        </table>
        <p style="color:#94a3b8;font-size:13px">We look forward to meeting with you. Contact ${bizName} if you need to reschedule.</p>
      </div>
    </div>`;

  const bizUserHtml = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#123B5D;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">New Meeting Scheduled</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">A new meeting has been booked.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:6px;overflow:hidden">
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px">Name</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right">${guestName}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Email</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${guestEmail}</td></tr>
          ${guestPhone ? `<tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Phone</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${guestPhone}</td></tr>` : ""}
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Date</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${dateStr}${timeStr}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Purpose</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${purposeStr}</td></tr>
        </table>
      </div>
    </div>`;

  await Promise.all([
    sendEmail({ to: guestEmail, subject: `Your meeting is scheduled with ${bizName}`, html: guestHtml }),
    biz?.email ? sendEmail({ to: biz.email, subject: `New meeting scheduled — ${guestName}`, html: bizUserHtml }) : Promise.resolve(),
  ]);

  await supabase.from("scheduled_meetings").update({ email_sent_to_guest: true, email_sent_to_user: !!biz?.email }).eq("id", meeting.id);

  return NextResponse.json({ meeting: { id: meeting.id, status: "scheduled" } }, { status: 201 });
}
