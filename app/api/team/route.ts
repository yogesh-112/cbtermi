import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { sendEmail, teamInviteEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: members } = await supabase.from("business_members").select("*, users(full_name, email)").eq("business_id", session.businessId);
  const { data: invites } = await supabase.from("team_invitations").select("*").eq("business_id", session.businessId).is("accepted_at", null).gt("expires_at", new Date().toISOString());
  return NextResponse.json({ members: members ?? [], invitations: invites ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { email, role = "staff" } = await request.json();
  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

  const token = generateToken();
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", session.businessId).single();

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await supabase.from("team_invitations").insert({ business_id: session.businessId, email, role, token, invited_by: session.id, expires_at: expires.toISOString() });

  const link = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite?token=${token}`;
  await sendEmail({ to: email, subject: `You're invited to ${biz?.name} on Clear Build USA`, html: teamInviteEmail(session.name, biz?.name ?? "Clear Build USA", link) });

  return NextResponse.json({ message: "Invitation sent" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { userId, invitationId } = await request.json();

  if (userId) await supabase.from("business_members").delete().eq("business_id", session.businessId).eq("user_id", userId);
  if (invitationId) await supabase.from("team_invitations").delete().eq("id", invitationId).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Removed" });
}
