import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const format    = sp.get("format");
  const limit     = format === "csv" ? 10000 : Math.min(parseInt(sp.get("limit") ?? "100"), 200);
  const offset    = format === "csv" ? 0 : parseInt(sp.get("offset") ?? "0");
  const projectId = sp.get("project_id");
  const category  = sp.get("category");

  let q = supabase
    .from("expenses")
    .select("*, projects(id, name)", { count: "exact" })
    .eq("business_id", session.businessId)
    .neq("status", "voided")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) q = q.eq("project_id", projectId);
  if (category)  q = q.eq("category", category);

  const { data, count } = await q;

  if (format === "csv") {
    const rows = (data ?? []).map((e: any) => ({ ...e, project_name: e.projects?.name }));
    const csv = toCSV(rows, [
      { key: "expense_date",  label: "Date" },
      { key: "title",         label: "Title" },
      { key: "category",      label: "Category" },
      { key: "project_name",  label: "Project" },
      { key: "amount",        label: "Amount" },
      { key: "description",   label: "Description" },
    ]);
    return csvResponse(csv, `expenses-${new Date().toISOString().split("T")[0]}.csv`);
  }

  return NextResponse.json({ expenses: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const body = await request.json();
  const { title, category, amount, expense_date } = body;

  if (!title?.trim())    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  if (!category?.trim()) return NextResponse.json({ message: "Category is required" }, { status: 400 });
  if (!amount || parseFloat(amount) < 0) return NextResponse.json({ message: "Valid amount required" }, { status: 400 });

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      business_id:  session.businessId,
      project_id:   body.project_id || null,
      category,
      title:        title.trim(),
      description:  body.description?.trim() || null,
      amount:       parseFloat(amount),
      expense_date: expense_date || new Date().toISOString().split("T")[0],
      receipt_url:  body.receipt_url?.trim() || null,
      status:       "recorded",
      created_by:   session.id,
    })
    .select("*, projects(id, name)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "expense",
    entityId: expense.id,
    action: "created",
    payload: { title, amount: parseFloat(amount), category },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
