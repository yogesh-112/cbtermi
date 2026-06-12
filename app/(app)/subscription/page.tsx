"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, ExternalLink, Zap, Clock, Calendar } from "lucide-react";
import { toast, PageSkeleton } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: 0,
    priceLabel: "Free",
    period: "14 days",
    desc: "Try everything for free. No card required.",
    features: ["All features included", "Unlimited contacts", "Quotes & invoices", "Team access", "Scheduling & booking", "Email support"],
    icon: Clock,
    color: "border-amber-200 bg-amber-50/30",
    badge: null,
    cta: null,
  },
  {
    id: "pro_monthly",
    name: "Monthly",
    price: 49,
    priceLabel: "$49",
    period: "/month",
    desc: "Full access, billed monthly. Cancel any time.",
    features: ["Everything in Free Trial", "Unlimited projects", "Scheduling & bookings", "Team management", "Templates library", "Priority support"],
    icon: Zap,
    color: "border-[#123B5D]",
    badge: null,
    cta: "Start Monthly Plan",
  },
  {
    id: "pro_yearly",
    name: "Yearly",
    price: 490,
    priceLabel: "$490",
    period: "/year",
    desc: "Best value — save $98 vs monthly billing.",
    features: ["Everything in Monthly", "2 months free", "Annual billing receipt", "Early access to new features"],
    icon: Calendar,
    color: "border-[#3FA66B]",
    badge: "2 MONTHS FREE",
    cta: "Start Yearly Plan",
  },
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portaling, setPortaling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadSub = async () => {
      // If returning from Stripe checkout, sync from Stripe first (in case webhook hasn't fired)
      if (searchParams.get("success") === "1") {
        toast("Subscription activated! Your plan is now live.", "success");
        await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: searchParams.get("session_id") }),
        }).catch(() => {});
      }
      const d = await fetch("/api/subscription").then(r => r.json()).catch(() => ({}));
      setSubscription(d.subscription ?? null);
      setLoading(false);
    };
    loadSub();
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const res = await fetch("/api/billing/apply-coupon", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
    });
    const data = await res.json();
    setApplyingCoupon(false);
    if (res.ok && data.coupon) {
      setAppliedCoupon(data.coupon);
      toast(`Coupon applied! ${data.coupon.discount_percent}% discount`, "success");
    } else {
      toast(data.message ?? "Invalid or expired coupon code.", "error");
    }
  };

  const upgrade = async (planId: string) => {
    setUpgrading(planId);
    const res = await fetch("/api/billing/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, couponCode: appliedCoupon?.code ?? null }),
    });
    const data = await res.json();
    setUpgrading(null);
    if (res.ok && data.url) window.location.href = data.url;
    else toast(data.message ?? "Failed to start checkout.", "error");
  };

  const manageBilling = async () => {
    setPortaling(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    setPortaling(false);
    if (res.ok && data.url) window.location.href = data.url;
    else toast(data.message ?? "No billing account yet — subscribe first.", "error");
  };

  if (loading) return <PageSkeleton />;

  const currentPlan = subscription?.plan ?? "trial";
  const currentCycle = subscription?.billing_cycle ?? "monthly";
  const currentPlanId = currentPlan !== "trial" ? `${currentPlan}_${currentCycle}` : "trial";
  const trialEnd = subscription?.trial_ends_at;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000)) : null;
  const periodEnd = subscription?.current_period_end ? fmtDate(subscription.current_period_end) : null;
  const isOnTrial = currentPlanId === "trial";
  const isExpired = isOnTrial && daysLeft !== null && daysLeft <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Subscription</h1>
        <p className="page-desc">
          {isOnTrial
            ? isExpired
              ? "Your free trial has ended. Upgrade to continue creating records."
              : `Free trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining.`
            : `Active subscription · renews ${currentCycle}${periodEnd ? ` on ${periodEnd}` : ""}`}
        </p>
      </div>

      {/* Trial countdown banner */}
      {isOnTrial && !isExpired && daysLeft !== null && (
        <div className="card p-5 bg-gradient-to-r from-[#123B5D] to-[#1a4a7a] text-white border-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1">TRIAL · FULL ACCESS</p>
              <p className="text-[28px] font-extrabold leading-tight" style={{ letterSpacing: "-0.03em" }}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
              </p>
              <p className="text-[13px] text-white/70 mt-1">Upgrade now to keep access after your trial ends.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10">
                <span className="text-[22px] font-bold">{daysLeft}</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.max(5, (daysLeft / 14) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Expired banner */}
      {isExpired && (
        <div className="card p-5 bg-red-50 border-red-200">
          <p className="font-semibold text-red-700 mb-1">Your free trial has ended</p>
          <p className="text-[13px] text-red-600">You can view existing data but cannot create or send new records. Upgrade to restore full access.</p>
        </div>
      )}

      {/* Coupon code input */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#0c1226]">Have a coupon code?</p>
          {appliedCoupon ? (
            <p className="text-[12px] text-brand-green mt-0.5">✓ {appliedCoupon.code} — {appliedCoupon.discount_percent}% off applied</p>
          ) : (
            <p className="text-[12px] text-[#8a8fa3] mt-0.5">Enter a coupon code to get a discount on your plan.</p>
          )}
        </div>
        {!appliedCoupon ? (
          <div className="flex gap-2 w-full sm:w-auto">
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code" className="field text-[13px] w-40 flex-shrink-0" />
            <button onClick={applyCoupon} disabled={applyingCoupon || !couponCode}
              className="btn btn-outline btn-sm flex-shrink-0">
              {applyingCoupon ? "Checking…" : "Apply"}
            </button>
          </div>
        ) : (
          <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="btn btn-ghost btn-sm text-[#8a8fa3]">
            Remove
          </button>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlanId;
          const isLoading = upgrading === plan.id;
          const Icon = plan.icon;
          return (
            <div key={plan.id} className={`card flex flex-col relative transition-all duration-200 hover:shadow-card-md border-2 ${isCurrent ? "border-[#123B5D] bg-[#f0f5ff]/30" : plan.color}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#3FA66B] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">{plan.badge}</span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-[#123B5D] text-white text-[10px] font-bold px-3 py-1 rounded-full">CURRENT PLAN</span>
                </div>
              )}
              <div className="px-5 pt-5 pb-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${plan.id === "trial" ? "bg-amber-100" : plan.id === "pro_monthly" ? "bg-[#f0f5ff]" : "bg-[#f0fdf4]"}`}>
                    <Icon size={16} className={plan.id === "trial" ? "text-amber-600" : plan.id === "pro_monthly" ? "text-[#123B5D]" : "text-[#3FA66B]"} />
                  </div>
                  <p className="font-bold text-[16px] text-[#1f2937]">{plan.name}</p>
                </div>
                <div className="mb-3">
                  <span className="text-[34px] font-extrabold text-[#0c1226]" style={{ letterSpacing: "-0.03em" }}>{plan.priceLabel}</span>
                  <span className="text-[#8a8fa3] text-[13px] ml-1">{plan.period}</span>
                </div>
                <p className="text-[12px] text-[#6b7280] mb-4 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[#374151]">
                      <Check size={13} className="text-[#3FA66B] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 pb-5 mt-2">
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl bg-[#f3f4f6] text-[#6b7280] text-[13px] font-medium">
                    ✓ Current Plan
                  </div>
                ) : plan.cta ? (
                  <button onClick={() => upgrade(plan.id)} disabled={isLoading || !!upgrading}
                    className={`btn w-full ${plan.id === "pro_yearly" ? "btn-primary" : "btn-primary"}`}>
                    {isLoading ? "Redirecting…" : plan.cta}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing management (only for active subscribers) */}
      {!isOnTrial && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Billing</h2>
          <p className="text-[13px] text-[#4a5168] mb-4">
            Manage your payment method, download invoices, and view billing history through the Stripe customer portal.
          </p>
          {subscription?.cancel_at_period_end && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-700">
              Subscription cancels at end of billing period · {periodEnd}
            </div>
          )}
          <button onClick={manageBilling} disabled={portaling} className="btn btn-outline flex items-center gap-2">
            <CreditCard size={14} />
            {portaling ? "Opening billing portal…" : "Open Billing Portal"}
            <ExternalLink size={12} className="ml-auto text-[#8a8fa3]" />
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Common Questions</h2>
        <div className="space-y-3">
          {[
            { q: "Can I cancel at any time?", a: "Yes. Monthly plans can be cancelled at any time. You keep access until the end of the billing period." },
            { q: "What happens to my data if I don't upgrade?", a: "Your data is safe. You can log in and view all records. Creating, editing, and sending requires an active subscription." },
            { q: "Is there a setup fee?", a: "No. There are no setup fees, contracts, or hidden charges." },
            { q: "Can I switch from monthly to yearly?", a: "Yes. Open the billing portal to switch plans. The change takes effect at the next billing cycle." },
          ].map(item => (
            <div key={item.q} className="border-b border-[#f3f4f6] pb-3 last:border-0">
              <p className="font-medium text-[14px] text-[#1f2937] mb-1">{item.q}</p>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
