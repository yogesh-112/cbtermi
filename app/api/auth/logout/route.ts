import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
