import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "No active session" }, { status: 400 });

  const payload = await verifyToken(token);
  if (!payload?.impersonatedBy) return NextResponse.json({ message: "Not in an impersonation session" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
