import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { logAdminAudit } from "@/lib/admin-audit";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: coupons, error } = await supabase
    .from("coupon_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ coupons: coupons ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code, description, discount_percent, max_uses, expires_at } = body;

  if (!code?.trim()) return NextResponse.json({ message: "Code is required" }, { status: 400 });
  if (!discount_percent || discount_percent < 1 || discount_percent > 100) {
    return NextResponse.json({ message: "Discount must be 1–100%" }, { status: 400 });
  }

  const { data: coupon, error } = await supabase
    .from("coupon_codes")
    .insert({
      code:             code.trim().toUpperCase(),
      description:      description?.trim() || null,
      discount_percent: parseInt(discount_percent),
      max_uses:         max_uses ? parseInt(max_uses) : null,
      expires_at:       expires_at || null,
      is_active:        true,
      created_by:       session.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ message: "Coupon code already exists" }, { status: 409 });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await logAdminAudit({
    adminId: session.id,
    action: "coupon_created",
    entityType: "coupon",
    entityId: coupon.id,
    payload: { code: coupon.code, discount_percent: coupon.discount_percent },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
