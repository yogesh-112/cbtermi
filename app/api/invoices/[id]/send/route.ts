import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { supabase } from "@/lib/supabase";
import { sendEmail, invoiceEmail } from "@/lib/email";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const { id } = await params;

  const { data: inv } = await supabase
    .from("invoices")
    .select("*, contacts(full_name, email), businesses(name)")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!inv) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  if (!inv.contacts?.email) return NextResponse.json({ message: "Contact has no email address" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const payLink = `${appUrl}/invoices/${id}/pay`;
  const trackPixel = `<img src="${appUrl}/api/invoices/${id}/track?ev=open" width="1" height="1" style="display:none" />`;

  const dueFormatted = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const html = invoiceEmail(
    inv.contacts.full_name,
    inv.businesses?.name || "Clear Build USA",
    inv.invoice_number,
    `$${Number(inv.total ?? 0).toFixed(2)}`,
    dueFormatted,
  ).replace("</div>", `${trackPixel}</div>`);

  // Add pay button to the email
  const htmlWithPayBtn = html.replace(
    `Please contact`,
    `<a href="${payLink}" style="display:inline-block;background:#1f9d57;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">View & Pay Invoice</a><br/><br/>Please contact`
  );

  const result = await sendEmail({
    to: inv.contacts.email,
    subject: `Invoice ${inv.invoice_number} from ${inv.businesses?.name || "Clear Build USA"}`,
    html: htmlWithPayBtn,
  });

  if (!result.success) return NextResponse.json({ message: "Failed to send email" }, { status: 500 });

  await supabase.from("invoices").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  return NextResponse.json({ message: "Invoice sent" });
}
