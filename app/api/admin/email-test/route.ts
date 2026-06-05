import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyAdminToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    RESEND_API_KEY:      process.env.RESEND_API_KEY ? `set (${process.env.RESEND_API_KEY.slice(0, 8)}...)` : "MISSING ❌",
    RESEND_FROM_EMAIL:   process.env.RESEND_FROM_EMAIL || "not set — using onboarding@resend.dev (test only) ⚠️",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING ❌ (email links will point to localhost)",
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyAdminToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to } = await request.json();
  if (!to) return NextResponse.json({ error: "to email required" }, { status: 400 });

  const result = await sendEmail({
    to,
    subject: "Clear Build USA — Email Test",
    html: `<div style="font-family:sans-serif;padding:24px">
      <h2>✅ Email is working!</h2>
      <p>This test email was sent from the Clear Build USA admin panel.</p>
      <p style="color:#666;font-size:13px">Sent at: ${new Date().toISOString()}</p>
    </div>`,
  });

  return NextResponse.json({
    success: result.success,
    config: {
      RESEND_API_KEY:      process.env.RESEND_API_KEY ? "set ✓" : "MISSING ❌",
      RESEND_FROM_EMAIL:   process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev (test only) ⚠️",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING ❌",
    },
  });
}
