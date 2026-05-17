import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const PUBLIC_PATHS = [
  "/login", "/register", "/verify-email", "/forgot-password",
  "/reset-password", "/api/auth", "/api/invite"
];

const APP_PATHS = [
  "/dashboard", "/contacts", "/leads", "/customers", "/quotes", "/invoices", "/payments",
  "/projects", "/item-requirements", "/project-updates", "/feedback",
  "/notifications", "/communications", "/team", "/settings", "/subscription",
  "/change-orders", "/profile", "/more", "/audit-log"
];

const ADMIN_PUBLIC = ["/admin/login"];
const ADMIN_PROTECTED = ["/admin/dashboard", "/admin/businesses", "/admin/users",
  "/admin/subscriptions", "/admin/payments", "/admin/plans", "/admin/audit-logs",
  "/admin/admins", "/admin/settings", "/admin/support", "/admin/broadcasts",
  "/admin/analytics", "/admin/security"];

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

  // ── Customer app routes ───────────────────────────────────────
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApp    = APP_PATHS.some((p) => pathname.startsWith(p));
  const isBusinessSetup = pathname === "/business-setup";

  if (isApp || isBusinessSetup) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (isApp && !payload.businessId && pathname !== "/business-setup") {
      return NextResponse.redirect(new URL("/business-setup", request.url));
    }
  }

  if (isPublic && token) {
    const payload = await verifyToken(token);
    if (payload && ["/login", "/register"].includes(pathname)) {
      const dest = payload.businessId ? "/dashboard" : "/business-setup";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
