import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { contact_id, project_id, message: customMessage } = await request.json();
  if (!contact_id) return NextResponse.json({ message: "Contact required" }, { status: 400 });

  const { data: contact } = await supabase
    .from("contacts").select("full_name, email").eq("id", contact_id)
    .eq("business_id", session.businessId).single();
  if (!contact?.email) return NextResponse.json({ message: "Contact has no email address" }, { status: 400 });

  const { data: biz } = await supabase.from("businesses").select("name").eq("id", session.businessId).single();
  const token = generateToken(32);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const respondUrl = `${appUrl}/feedback/respond/${token}`;

  // Create pending feedback record
  const { data: fb, error } = await supabase.from("feedback").insert({
    business_id: session.businessId,
    contact_id,
    project_id: project_id || null,
    token,
    status: "pending",
    email_sent_at: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const bizName = biz?.name || "Clear Build USA";
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#15294d;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">${bizName}</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">Hi ${contact.full_name},</p>
        <p style="color:#475569">${customMessage || `Thank you for working with ${bizName}! We'd love to hear your feedback.`}</p>
        <a href="${respondUrl}" style="display:inline-block;background:#2348c4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Share Your Feedback</a>
        <p style="color:#94a3b8;font-size:13px">Takes less than a minute. Your feedback helps us improve.</p>
      </div>
    </div>`;

  const result = await sendEmail({
    to: contact.email,
    subject: `${bizName} would love your feedback`,
    html,
  });

  if (!result.success) return NextResponse.json({ message: "Feedback record created but email failed to send" }, { status: 207 });
  return NextResponse.json({ feedback: fb, message: "Feedback request sent" }, { status: 201 });
}
