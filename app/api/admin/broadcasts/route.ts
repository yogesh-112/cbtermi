import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // Return audience size estimates
  const [all, active, trial] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("email_verified", true),
    supabase.from("subscriptions").select("businesses(business_members(users(email, email_verified)))", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "trialing"),
  ]);
  return NextResponse.json({
    audiences: {
      all_verified: all.count ?? 0,
      active_subscribers: active.count ?? 0,
      trial_users: trial.count ?? 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "support")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { subject, body, target, preview_only } = await request.json();
  if (!subject || !body) return NextResponse.json({ message: "Subject and body required" }, { status: 400 });

  // Resolve recipient emails
  let emails: string[] = [];

  if (target === "all") {
    const { data } = await supabase.from("users").select("email").eq("email_verified", true);
    emails = (data ?? []).map((u: any) => u.email).filter(Boolean);
  } else if (target === "active") {
    const { data } = await supabase
      .from("subscriptions")
      .select("businesses(business_members(users(email)))")
      .eq("status", "active");
    emails = (data ?? []).flatMap((s: any) =>
      (s.businesses?.business_members ?? []).flatMap((m: any) => m.users?.email ? [m.users.email] : [])
    );
  } else if (target === "trial") {
    const { data } = await supabase
      .from("subscriptions")
      .select("businesses(business_members(users(email)))")
      .eq("status", "trialing");
    emails = (data ?? []).flatMap((s: any) =>
      (s.businesses?.business_members ?? []).flatMap((m: any) => m.users?.email ? [m.users.email] : [])
    );
  }

  // Deduplicate
  emails = [...new Set(emails)];

  if (preview_only) {
    return NextResponse.json({ recipientCount: emails.length, preview: emails.slice(0, 5) });
  }

  if (emails.length === 0) return NextResponse.json({ message: "No recipients found" }, { status: 400 });

  // Send in batches of 10
  let sent = 0;
  const htmlBody = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#123B5D;padding:16px 24px;border-radius:8px 8px 0 0">
      <span style="color:white;font-size:16px;font-weight:600">Clear Build USA</span>
    </div>
    <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:28px 24px">
      ${body.replace(/\n/g, "<br>")}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:12px">You are receiving this because you have an account with Clear Build USA.</p>
    </div>
  </div>`;

  for (const email of emails) {
    await sendEmail({ to: email, subject, html: htmlBody });
    sent++;
  }

  await logAdminAudit({
    adminId: session.id,
    action: "broadcast_sent",
    payload: { subject, target, recipientCount: sent },
  });

  return NextResponse.json({ sent, total: emails.length });
}
