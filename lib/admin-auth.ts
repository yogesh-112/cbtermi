import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "support" | "billing" | "developer" | "readonly";
}

export const ADMIN_COOKIE = "cb_admin_session";

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET environment variable is not set. Add it to .env (see .env.example).");
}
const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
const getSecret = () => secret;

export async function signAdminToken(payload: AdminPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdminSession(): Promise<AdminPayload> {
  const session = await getAdminSession();
  if (!session) throw new Error("Admin unauthorized");
  return session;
}

const ROLE_RANK: Record<string, number> = {
  super_admin: 5,
  developer:   4,
  billing:     3,
  support:     2,
  readonly:    1,
};

export function canAdminDo(role: string, minRole: string): boolean {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}
