import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ message: "Code required" }, { status: 400 });

  const { data: coupon } = await supabase
    .from("coupon_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!coupon) return NextResponse.json({ message: "Invalid or expired coupon code." }, { status: 404 });

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ message: "This coupon code has expired." }, { status: 400 });
  }

  // Check max uses
  if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ message: "This coupon code has reached its usage limit." }, { status: 400 });
  }

  return NextResponse.json({ coupon: { code: coupon.code, discount_percent: coupon.discount_percent } });
}
