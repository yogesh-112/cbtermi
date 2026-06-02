import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { sendEmail, quoteSentEmail } from "@/lib/email";
import { triggerNotificationRule } from "@/lib/notification-rules";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: quote } = await supabase.from("quotes").select("*, contacts(*), projects(name)").eq("id", id).eq("business_id", session.businessId).single();
  if (!quote) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order");
  return NextResponse.json({ quote, items: items ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { items, ...body } = await request.json();

  const { data: existing } = await supabase.from("quotes").select("status").eq("id", id).eq("business_id", session.businessId).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Block edits on approved/converted quotes (status change to void is still allowed)
  if (["approved", "converted"].includes(existing.status) && body.status !== "voided") {
    return NextResponse.json({ message: `Cannot edit an ${existing.status} quote. Create a new version or a change order instead.` }, { status: 400 });
  }

  if (items) {
    await supabase.from("quote_items").delete().eq("quote_id", id);
    const subtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const tax_amount = items.reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
    body.subtotal = subtotal; body.tax_amount = tax_amount; body.total = subtotal + tax_amount;
    await supabase.from("quote_items").insert(items.map((item: any, i: number) => ({ ...item, quote_id: id, sort_order: i })));
  }

  const { data, error } = await supabase.from("quotes").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select("*, contacts(full_name, email), businesses(name)").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Send email when quote is marked as sent
  if (body.status === "sent" && existing.status !== "sent") {
    const contact = data.contacts as any;
    const biz = data.businesses as any;
    if (contact?.email) {
      const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEmail({
        to: contact.email,
        subject: `Quote ${data.quote_number} from ${biz?.name ?? "your contractor"}`,
        html: quoteSentEmail(contact.full_name ?? "Customer", biz?.name ?? "Your Contractor", data.quote_number, fmtMoney(data.total ?? 0), `${appUrl}/quotes/${id}/preview`),
      });
    }
    // Trigger automation rule (fire-and-forget)
    triggerNotificationRule({ businessId: session.businessId, ruleType: "quote_sent", contactId: data.contact_id, entityType: "quote", entityId: id }).catch(() => {});
  }

  if (body.status === "approved" && existing.status !== "approved") {
    triggerNotificationRule({ businessId: session.businessId, ruleType: "quote_approved", contactId: data.contact_id, entityType: "quote", entityId: id }).catch(() => {});
  }
  if (body.status === "rejected" && existing.status !== "rejected") {
    triggerNotificationRule({ businessId: session.businessId, ruleType: "quote_rejected", contactId: data.contact_id, entityType: "quote", entityId: id }).catch(() => {});
  }

  return NextResponse.json({ quote: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can delete quotes." }, { status: 403 });
  }
  const { id } = await params;

  const { data: existing } = await supabase.from("quotes").select("status").eq("id", id).eq("business_id", session.businessId).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (["approved", "converted"].includes(existing.status)) {
    return NextResponse.json({ message: `Cannot delete an ${existing.status} quote.` }, { status: 400 });
  }

  await supabase.from("quote_items").delete().eq("quote_id", id);
  await supabase.from("quotes").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
