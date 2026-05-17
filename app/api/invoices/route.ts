import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";
import { sendEmail, invoiceEmail } from "@/lib/email";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("invoices").select("*, contacts(full_name), projects(name)").eq("business_id", session.businessId).order("created_at", { ascending: false });
  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const { items, ...body } = await request.json();

  // Auto-create project if none selected
  let project_id = body.project_id;
  if (!project_id && body.contact_id) {
    const { data: biz } = await supabase.from("businesses").select("project_prefix").eq("id", session.businessId).single();
    const { count: pc } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", session.businessId);
    const pnum = `${biz?.project_prefix ?? "PRJ-"}${String((pc ?? 0) + 1).padStart(4, "0")}`;
    const { data: proj } = await supabase.from("projects").insert({ business_id: session.businessId, contact_id: body.contact_id, name: `Invoice Job - ${body.invoice_number ?? "New"}`, project_number: pnum, created_by: session.id }).select().single();
    project_id = proj?.id;
  }

  const { data: biz } = await supabase.from("businesses").select("invoice_prefix").eq("id", session.businessId).single();
  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("business_id", session.businessId);
  const invoice_number = body.invoice_number || `${biz?.invoice_prefix ?? "INV-"}${String((count ?? 0) + 1).padStart(4, "0")}`;

  const subtotal = (items ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0);
  const tax_amount = (items ?? []).reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
  const total = subtotal + tax_amount;

  const { data: invoice, error } = await supabase.from("invoices").insert({ ...body, invoice_number, project_id, business_id: session.businessId, subtotal, tax_amount, total, amount_due: total, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (items?.length) {
    await supabase.from("invoice_items").insert(items.map((item: any, i: number) => ({ ...item, invoice_id: invoice.id, sort_order: i })));
  }
  await logAudit({ businessId: session.businessId, userId: session.id, entityType: "invoice", entityId: invoice.id, action: "created", payload: { invoice_number: invoice.invoice_number, total } });

  // Send invoice email to contact
  if (body.contact_id) {
    const { data: contact } = await supabase.from("contacts").select("full_name, email").eq("id", body.contact_id).single();
    const { data: bizInfo } = await supabase.from("businesses").select("name").eq("id", session.businessId).single();
    if (contact?.email) {
      const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const dueLabel = body.due_date ? new Date(body.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
      await sendEmail({
        to: contact.email,
        subject: `Invoice ${invoice.invoice_number} from ${bizInfo?.name ?? "your contractor"}`,
        html: invoiceEmail(contact.full_name ?? "Customer", bizInfo?.name ?? "Your Contractor", invoice.invoice_number, fmtMoney(total), dueLabel),
      });
    }
  }

  return NextResponse.json({ invoice }, { status: 201 });
}
