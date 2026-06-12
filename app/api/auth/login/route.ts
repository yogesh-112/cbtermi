import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:${clientIp(request)}`, 10, 5 * 60 * 1000);
  if (limited) return limited;

  const { email, password } = await request.json();

  if (!email || !password)
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });

  const { data: user } = await supabase
    .from("users").select("id, full_name, email, password, email_verified, last_business_id")
    .eq("email", email).single();

  if (!user || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

  if (!user.email_verified)
    return NextResponse.json({ message: "Email not verified", unverified: true }, { status: 403 });

  // Resolve business
  const { data: members } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id);

  let businessId: string | undefined;
  let role = "owner";

  if (members && members.length > 0) {
    const last = members.find((m) => m.business_id === user.last_business_id) ?? members[0];
    businessId = last.business_id;
    role = last.role;
  }

  const token = await signToken({ id: user.id, name: user.full_name, email: user.email, businessId, role });
  const redirect = businessId ? "/dashboard" : "/business-setup";

  const res = NextResponse.json({ message: "Login successful", redirect });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
