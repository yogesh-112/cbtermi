import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  businessId?: string;
  role?: string;
  impersonatedBy?: string; // adminId — set when admin is impersonating this user
}

export const SESSION_COOKIE = "cb_session";
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Add it to .env (see .env.example).");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

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
