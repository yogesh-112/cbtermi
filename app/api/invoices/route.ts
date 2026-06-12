import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";
import { sendEmail, invoiceEmail } from "@/lib/email";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const format = sp.get("format");
  const limit  = format === "csv" ? 10000 : Math.min(parseInt(sp.get("limit") ?? "50"), 100);
  const offset = format === "csv" ? 0 : parseInt(sp.get("offset") ?? "0");

  let q = supabase.from("invoices").select("*, contacts(full_name), projects(name)", { count: "exact" }).eq("business_id", session.businessId);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, count } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (format === "csv") {
    const rows = (data ?? []).map((i: any) => ({ ...i, contact_name: i.contacts?.full_name, project_name: i.projects?.name }));
    const csv = toCSV(rows, [
      { key: "invoice_number", label: "Invoice #" },
      { key: "contact_name",   label: "Customer" },
      { key: "project_name",   label: "Project" },
      { key: "status",         label: "Status" },
      { key: "total",          label: "Total" },
      { key: "amount_paid",    label: "Amount Paid" },
      { key: "amount_due",     label: "Amount Due" },
      { key: "issue_date",     label: "Issue Date" },
      { key: "due_date",       label: "Due Date" },
    ]);
    return csvResponse(csv, `invoices-${new Date().toISOString().split("T")[0]}.csv`);
  }
  // Fetch summary fields for accurate stats regardless of pagination
  const { data: allInv } = await supabase.from("invoices").select("status, total, amount_due, due_date").eq("business_id", session.businessId);
  const now = new Date();
  const outstanding = allInv?.filter(i => !["paid","voided","draft"].includes(i.status)) ?? [];
  const overdue = outstanding.filter(i => { const d = i.due_date ? new Date(i.due_date) : null; return d && d < now; });
  const dueThisWeekArr = outstanding.filter(i => {
    const d = i.due_date ? new Date(i.due_date) : null;
    if (!d) return false;
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  });
  const summary = {
    outstandingAmt: outstanding.reduce((s, i) => s + (i.amount_due ?? 0), 0),
    paidAmt: allInv?.filter(i => i.status === "paid").reduce((s, i) => s + (i.total ?? 0), 0) ?? 0,
    dueThisWeekAmt: dueThisWeekArr.reduce((s, i) => s + (i.amount_due ?? 0), 0),
    dueThisWeekCount: dueThisWeekArr.length,
    overdueAmt: overdue.reduce((s, i) => s + (i.amount_due ?? 0), 0),
    overdueCount: overdue.length,
    outstandingCount: outstanding.length,
    counts: {
      all: allInv?.length ?? 0,
      draft: allInv?.filter(i => i.status === "draft").length ?? 0,
      sent: allInv?.filter(i => i.status === "sent").length ?? 0,
      overdue: overdue.length,
      paid: allInv?.filter(i => i.status === "paid").length ?? 0,
    },
  };
  return NextResponse.json({ invoices: data ?? [], total: count ?? 0, summary });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const { items, ...body } = await request.json();
  // Postgres rejects "" for date/uuid columns — normalize to null
  for (const k of ["issue_date", "due_date", "contact_id", "project_id"]) {
    if (body[k] === "") body[k] = null;
  }

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

  const subtotal = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100);
  }, 0);
  const tax_amount = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100) * ((i.tax_rate ?? 0) / 100);
  }, 0);
  const total = subtotal + tax_amount;

  const { data: invoice, error } = await supabase.from("invoices").insert({ ...body, invoice_number, project_id, business_id: session.businessId, subtotal, tax_amount, total, amount_due: total, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (items?.length) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(items.map((item: any, i: number) => ({ ...item, invoice_id: invoice.id, sort_order: i })));
    if (itemsErr) console.error("[invoices] invoice_items insert failed:", itemsErr.message);
  }
  await logAudit({ businessId: session.businessId, userId: session.id, entityType: "invoice", entityId: invoice.id, action: "created", payload: { invoice_number: invoice.invoice_number, total } });

  // Send invoice email to contact
  if (body.contact_id) {
    const { data: contact } = await supabase.from("contacts").select("full_name, email").eq("id", body.contact_id).eq("business_id", session.businessId).single();
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
