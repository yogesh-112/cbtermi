import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { signToken, SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Token required" }, { status: 400 });

  const { data: invite } = await supabase
    .from("team_invitations")
    .select("*, businesses(name), users!invited_by(full_name)")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) return NextResponse.json({ message: "Invitation not found or already used" }, { status: 404 });

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ message: "Invitation has expired" }, { status: 410 });
  }

  return NextResponse.json({
    invitation: {
      email: invite.email,
      role: invite.role,
      business_name: invite.businesses?.name ?? "a business",
      invited_by: invite.users?.full_name ?? "Someone",
      expires_at: invite.expires_at,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Login required" }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ message: "Token required" }, { status: 400 });

  const { data: invite } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) return NextResponse.json({ message: "Invitation not found or already used" }, { status: 404 });

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ message: "Invitation has expired" }, { status: 410 });
  }

  if (invite.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ message: "This invitation was sent to a different email address" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", invite.business_id)
    .eq("user_id", session.id)
    .single();

  if (!existing) {
    await supabase.from("business_members").insert({
      business_id: invite.business_id,
      user_id: session.id,
      role: invite.role,
    });
  }

  await supabase
    .from("team_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await supabase.from("users").update({ last_business_id: invite.business_id }).eq("id", session.id);

  const newToken = await signToken({
    ...session,
    businessId: invite.business_id,
    role: invite.role,
  });

  const res = NextResponse.json({ message: "Joined successfully" });
  res.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
