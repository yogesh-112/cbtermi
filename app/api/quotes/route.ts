import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { toCSV, csvResponse } from "@/lib/csv";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sp     = request.nextUrl.searchParams;
  const status = sp.get("status");
  const format = sp.get("format");
  const limit  = format === "csv" ? 10000 : Math.min(parseInt(sp.get("limit") ?? "50"), 100);
  const offset = format === "csv" ? 0 : parseInt(sp.get("offset") ?? "0");

  let q = supabase.from("quotes").select("*, contacts(full_name), projects(name)", { count: "exact" }).eq("business_id", session.businessId);
  if (status && status !== "all") {
    if (status === "sent") q = q.in("status", ["sent", "viewed"]);
    else q = q.eq("status", status);
  }
  const { data, count } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (format === "csv") {
    const rows = (data ?? []).map((q: any) => ({ ...q, contact_name: q.contacts?.full_name, project_name: q.projects?.name }));
    const csv = toCSV(rows, [
      { key: "quote_number",  label: "Quote #" },
      { key: "contact_name",  label: "Customer" },
      { key: "project_name",  label: "Project" },
      { key: "status",        label: "Status" },
      { key: "total",         label: "Total" },
      { key: "valid_until",   label: "Valid Until" },
      { key: "created_at",    label: "Created" },
    ]);
    return csvResponse(csv, `quotes-${new Date().toISOString().split("T")[0]}.csv`);
  }
  // Fetch status-only rows for accurate tab counts regardless of filter
  const { data: allStatuses } = await supabase.from("quotes").select("status, total").eq("business_id", session.businessId);
  const counts = {
    all: allStatuses?.length ?? 0,
    draft: allStatuses?.filter(q => q.status === "draft").length ?? 0,
    sent: allStatuses?.filter(q => ["sent","viewed"].includes(q.status)).length ?? 0,
    approved: allStatuses?.filter(q => q.status === "approved").length ?? 0,
    rejected: allStatuses?.filter(q => q.status === "rejected").length ?? 0,
    totalValue: allStatuses?.reduce((s, q) => s + (q.total ?? 0), 0) ?? 0,
  };
  return NextResponse.json({ quotes: data ?? [], total: count ?? 0, counts });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const { items, ...raw } = await request.json();
  // Whitelist actual quotes columns — the form sends helper fields
  // (contact_name, contact_email, project_type, project_address) that
  // don't exist in the table and would fail the insert.
  const QUOTE_FIELDS = [
    "contact_id", "project_id", "opportunity_id", "quote_number", "title",
    "issue_date", "valid_until", "status", "discount_amount", "notes", "terms",
  ] as const;
  const body: Record<string, any> = {};
  for (const k of QUOTE_FIELDS) if (raw[k] !== undefined) body[k] = raw[k];
  // Postgres rejects "" for date/uuid columns — normalize to null
  for (const k of ["issue_date", "valid_until", "contact_id", "project_id", "opportunity_id"]) {
    if (body[k] === "") body[k] = null;
  }

  const { data: biz } = await supabase.from("businesses").select("quote_prefix").eq("id", session.businessId).single();
  const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true }).eq("business_id", session.businessId);
  const quote_number = body.quote_number || `${biz?.quote_prefix ?? "Q-"}${String((count ?? 0) + 1).padStart(4, "0")}`;

  const subtotal = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100);
  }, 0);
  const tax_amount = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100) * ((i.tax_rate ?? 0) / 100);
  }, 0);
  const total = subtotal + tax_amount;

  const { data: quote, error } = await supabase.from("quotes").insert({ ...body, quote_number, business_id: session.businessId, subtotal, tax_amount, total, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (items?.length) {
    const { error: itemsErr } = await supabase.from("quote_items").insert(items.map((item: any, i: number) => ({ ...item, quote_id: quote.id, sort_order: i })));
    if (itemsErr) console.error("[quotes] quote_items insert failed:", itemsErr.message);
  }

  // Send email to contact when status is "sent"
  if (body.status === "sent" && body.contact_id) {
    const { data: contact } = await supabase.from("contacts").select("full_name, email").eq("id", body.contact_id).eq("business_id", session.businessId).single();
    const { data: bizInfo } = await supabase.from("businesses").select("name").eq("id", session.businessId).single();
    if (contact?.email) {
      const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const validLabel = body.valid_until ? new Date(body.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEmail({
        to: contact.email,
        subject: `Quote ${quote.quote_number} from ${bizInfo?.name ?? "your contractor"}`,
        html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <div style="background:#16265a;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;font-size:20px;margin:0">${bizInfo?.name ?? "Clear Build USA"}</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 8px 8px">
            <p style="color:#0f172a;font-size:16px">Hi ${contact.full_name ?? "there"},</p>
            <p style="color:#475569">Your quote <strong>${quote.quote_number}</strong> is ready to review.</p>
            <p style="color:#475569">Total: <strong>${fmtMoney(total)}</strong>${validLabel ? ` · Valid until ${validLabel}` : ""}</p>
            <a href="${appUrl}/quotes/${quote.id}/preview" style="display:inline-block;background:#16265a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Review Quote</a>
            <p style="color:#94a3b8;font-size:13px">Questions? Reply to this email and we'll get back to you.</p>
          </div>
        </div>`,
      }).catch(err => console.error("[quotes] email failed:", err));
    }
  }

  return NextResponse.json({ quote }, { status: 201 });
}
