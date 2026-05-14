import { Resend } from "resend";

const FROM = "Clear Build USA <no-reply@clearbuildusa.com>";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log("\n📧 [EMAIL MOCK]");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${html.replace(/<[^>]+>/g, "").trim().slice(0, 200)}...`);
    console.log("");
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
