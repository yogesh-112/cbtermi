import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

// Paths that are always public — no authentication required.
// API routes are NOT listed here; they manage their own auth via requireSession().
// NOTE: matched with startsWith — "/" is special-cased to an exact match below,
// otherwise every path would be public.
const PUBLIC_PATHS = [
  "/login", "/register", "/verify-email", "/forgot-password", "/reset-password",
  "/invite",
  "/booking/",            // public booking pages
  "/feedback/respond",    // public feedback response page (email link for customers)
  "/api/auth",
  "/api/invite",
  "/api/feedback/respond",
  "/api/public/",
  "/api/webhooks/",
];

// Specific sub-paths that are public within otherwise-protected route trees
// (e.g. /quotes/[id]/preview is public but /quotes is not)
const PUBLIC_SUBPATH_RE = [
  /^\/quotes\/[^/]+\/preview(\/|$)/,
  /^\/invoices\/[^/]+\/pay(\/|$)/,
  /^\/change-orders\/[^/]+\/preview(\/|$)/,
];

const ADMIN_PUBLIC = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    const isAdminPublic = ADMIN_PUBLIC.some(p => pathname.startsWith(p));

    if (isAdminPublic) {
      if (adminToken) {
        const payload = await verifyAdminToken(adminToken);
        if (payload) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Protected admin path — require valid admin token
    if (!adminToken) return NextResponse.redirect(new URL("/admin/login", request.url));
    const adminPayload = await verifyAdminToken(adminToken);
    if (!adminPayload) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete(ADMIN_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  // ── API routes manage their own auth — pass through ───────────
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // ── Customer app routes ───────────────────────────────────────
  const isPublic = pathname === "/"
    || PUBLIC_PATHS.some(p => pathname.startsWith(p))
    || PUBLIC_SUBPATH_RE.some(re => re.test(pathname));
  const isBusinessSetup = pathname === "/business-setup";
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Redirect already-logged-in users away from auth pages
  if (isPublic && token && ["/login", "/register"].includes(pathname)) {
    const payload = await verifyToken(token);
    if (payload) {
      return NextResponse.redirect(new URL(payload.businessId ? "/dashboard" : "/business-setup", request.url));
    }
  }

  // Protect every non-public page by default
  if (!isPublic) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (!payload.businessId && !isBusinessSetup) {
      return NextResponse.redirect(new URL("/business-setup", request.url));
    }
  }

  // Never let proxies/browsers cache page HTML: after a deploy, stale HTML
  // points at hashed CSS/JS chunks that no longer exist (unstyled pages).
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-cache, must-revalidate");
  return res;
}

export const config = {
  // Skip Next internals and any static file (paths containing a dot, e.g.
  // /logo.png) — otherwise the auth redirect breaks images and assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
