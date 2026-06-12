import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

// Test-only endpoint: extends the trial for the current business so Playwright
// create-flow tests are not blocked by checkTrialAccess returning 403.
// Disabled in production regardless of env vars.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const secret = process.env.PLAYWRIGHT_TEST_SECRET;
  if (!secret || request.headers.get("x-test-secret") !== secret) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const session = await requireSession().catch(() => null);
  if (!session?.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const trialEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("businesses")
    .update({ trial_ends_at: trialEnd, restricted_mode: false })
    .eq("id", session.businessId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, trial_ends_at: trialEnd });
}
