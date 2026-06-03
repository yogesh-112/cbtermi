import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { triggerNotificationRule } from "@/lib/notification-rules";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const type   = sp.get("type");
  const format = sp.get("format");
  const limit  = format === "csv" ? 10000 : Math.min(parseInt(sp.get("limit") ?? "50"), 100);
  const offset = format === "csv" ? 0 : parseInt(sp.get("offset") ?? "0");

  let q = supabase.from("contacts").select("*", { count: "exact" }).eq("business_id", session.businessId).order("created_at", { ascending: false });
  if (type) q = q.eq("contact_type", type);
  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (format === "csv") {
    const csv = toCSV(data ?? [], [
      { key: "full_name",     label: "Full Name" },
      { key: "email",         label: "Email" },
      { key: "phone",         label: "Phone" },
      { key: "contact_type",  label: "Type" },
      { key: "lead_status",   label: "Lead Status" },
      { key: "source",        label: "Source" },
      { key: "address",       label: "Address" },
      { key: "city",          label: "City" },
      { key: "state",         label: "State" },
      { key: "zip",           label: "ZIP" },
      { key: "created_at",    label: "Created" },
    ]);
    return csvResponse(csv, `contacts-${new Date().toISOString().split("T")[0]}.csv`);
  }

  const { data: typeCounts } = await supabase.from("contacts").select("contact_type").eq("business_id", session.businessId);
  const counts = {
    all:       typeCounts?.length ?? 0,
    leads:     typeCounts?.filter(c => c.contact_type === "lead").length ?? 0,
    customers: typeCounts?.filter(c => c.contact_type === "customer").length ?? 0,
  };
  return NextResponse.json({ contacts: data ?? [], total: count ?? 0, counts });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const body = await request.json();
  if (!body.full_name) return NextResponse.json({ message: "Full name required" }, { status: 400 });
  const { data, error } = await supabase.from("contacts").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Trigger new_lead automation if this is a lead
  if (data.contact_type === "lead") {
    triggerNotificationRule({ businessId: session.businessId, ruleType: "new_lead", contactId: data.id, entityType: "contact", entityId: data.id }).catch(() => {});
  }

  return NextResponse.json({ contact: data }, { status: 201 });
}
