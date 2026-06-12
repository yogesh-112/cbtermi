import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight in-memory rate limiter (fixed window per key).
 * Suitable for the single-Node deployment on Hostinger — resets on restart.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so the map doesn't grow forever
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a 429 response when the limit is exceeded, otherwise null.
 * @param key      unique key, e.g. `login:${ip}`
 * @param limit    max attempts per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count++;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { message: "Too many attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  return null;
}
