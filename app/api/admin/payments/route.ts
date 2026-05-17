import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 25;
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from("payments")
    .select(`
      id, amount, payment_method, notes, created_at, is_reversed,
      businesses(id, name),
      contacts(full_name),
      invoices(invoice_number)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data: totals } = await supabase
    .from("payments")
    .select("amount")
    .eq("is_reversed", false)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const mrr30d = (totals ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  return NextResponse.json({ payments: data ?? [], total: count ?? 0, page, limit, mrr30d });
}
