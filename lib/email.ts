import { Resend } from "resend";

// Use RESEND_FROM_EMAIL env var if set (for custom verified domain),
// otherwise fall back to Resend's shared testing domain.
const FROM = process.env.RESEND_FROM_EMAIL || "Clear Build USA <onboarding@resend.dev>";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY is not set — email not sent (mock mode)");
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    return { success: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (data) return { success: true };
    const retryable = !error?.statusCode;
    if (!retryable || attempt === 3) {
      console.error(`[Resend error] attempt ${attempt}`, error);
      return { success: false };
    }
    await new Promise(r => setTimeout(r, attempt * 500));
  }
  return { success: false };
}

export function verificationEmail(name: string, link: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#1B3A5C;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Clear Build USA</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">Hi ${name},</p>
        <p style="color:#475569">Please verify your email address to activate your Clear Build USA account.</p>
        <a href="${link}" style="display:inline-block;background:#1B3A5C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
        <p style="color:#94a3b8;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    </div>`;
}

export function passwordResetEmail(name: string, link: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#1B3A5C;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Clear Build USA</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">Hi ${name},</p>
        <p style="color:#475569">We received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;background:#1B3A5C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
        <p style="color:#94a3b8;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>`;
}

export function teamInviteEmail(inviterName: string, businessName: string, link: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <div style="background:#1B3A5C;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Clear Build USA</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
        <p style="color:#0f172a;font-size:16px">${inviterName} has invited you to join <strong>${businessName}</strong> on Clear Build USA.</p>
        <a href="${link}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Accept Invitation</a>
        <p style="color:#94a3b8;font-size:13px">This invitation expires in 7 days.</p>
      </div>
    </div>`;
}

function emailShell(content: string) {
  return `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
    <div style="background:#1B3A5C;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;font-size:20px;margin:0">Clear Build USA</h1>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
      ${content}
    </div>
  </div>`;
}

export function quoteSentEmail(contactName: string, businessName: string, quoteNumber: string, total: string, previewLink: string) {
  return emailShell(`
    <p style="color:#0f172a;font-size:16px">Hi ${contactName},</p>
    <p style="color:#475569">${businessName} has sent you a quote for review.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:6px;overflow:hidden">
      <tr><td style="padding:10px 14px;color:#64748b;font-size:13px">Quote</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right">${quoteNumber}</td></tr>
      <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Total</td><td style="padding:10px 14px;font-weight:700;font-size:15px;text-align:right;border-top:1px solid #e2e8f0">${total}</td></tr>
    </table>
    <a href="${previewLink}" style="display:inline-block;background:#1B3A5C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Review &amp; Approve Quote</a>
    <p style="color:#94a3b8;font-size:13px">Click the button to review the full quote and approve online.</p>`);
}

export function quoteApprovedEmail(businessEmail: string, contactName: string, quoteNumber: string, total: string) {
  return emailShell(`
    <p style="color:#0f172a;font-size:16px">Quote approved!</p>
    <p style="color:#475569"><strong>${contactName}</strong> has approved quote <strong>${quoteNumber}</strong> (${total}).</p>
    <p style="color:#475569">Log in to your dashboard to view the approval and next steps.</p>
    <p style="color:#94a3b8;font-size:13px">Sent to: ${businessEmail}</p>`);
}

export function invoiceEmail(contactName: string, businessName: string, invoiceNumber: string, total: string, dueDate: string) {
  return emailShell(`
    <p style="color:#0f172a;font-size:16px">Hi ${contactName},</p>
    <p style="color:#475569">You have a new invoice from <strong>${businessName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:6px;overflow:hidden">
      <tr><td style="padding:10px 14px;color:#64748b;font-size:13px">Invoice</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right">${invoiceNumber}</td></tr>
      <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Amount due</td><td style="padding:10px 14px;font-weight:700;font-size:15px;text-align:right;border-top:1px solid #e2e8f0">${total}</td></tr>
      ${dueDate ? `<tr><td style="padding:10px 14px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0">Due</td><td style="padding:10px 14px;font-weight:600;font-size:13px;text-align:right;border-top:1px solid #e2e8f0">${dueDate}</td></tr>` : ""}
    </table>
    <p style="color:#94a3b8;font-size:13px">Please contact ${businessName} with any questions about this invoice.</p>`);
}

export function paymentConfirmEmail(contactName: string, businessName: string, invoiceNumber: string, amountPaid: string) {
  return emailShell(`
    <p style="color:#0f172a;font-size:16px">Hi ${contactName},</p>
    <p style="color:#475569">Your payment of <strong>${amountPaid}</strong> for invoice <strong>${invoiceNumber}</strong> has been received by <strong>${businessName}</strong>. Thank you!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0">
      <p style="color:#16a34a;font-weight:600;margin:0">Payment confirmed ✓</p>
    </div>
    <p style="color:#94a3b8;font-size:13px">Keep this email for your records.</p>`);
}
