import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  businessId?: string;
  role?: string;
}

export const SESSION_COOKIE = "cb_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-fallback-secret-change-in-prod");

export async function signToken(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
