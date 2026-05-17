import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE, SessionPayload } from "./session";
import { supabase } from "./supabase";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Skip ban/force-logout checks for impersonation sessions (admin-controlled)
  if (!session.impersonatedBy) {
    const { data: user } = await supabase
      .from("users")
      .select("is_banned, force_logout_at")
      .eq("id", session.id)
      .maybeSingle();

    if (user?.is_banned) throw new Error("Account suspended");

    if (user?.force_logout_at) {
      const iat = (session as any).iat ?? 0;
      const invalidatedAt = Math.floor(new Date(user.force_logout_at).getTime() / 1000);
      if (invalidatedAt > iat) throw new Error("Session invalidated");
    }
  }

  return session;
}
