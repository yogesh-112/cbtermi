"use client";
import { useEffect, useState } from "react";
import { Check, Zap, Building2, Crown } from "lucide-react";
import { toast, PageSkeleton, StatusBadge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    period: "14 days",
    icon: Zap,
    accent: "text-[#9CA3AF]",
    ring: "border-[#E5E7EB]",
    badge: "",
    features: ["Up to 10 contacts", "5 quotes / invoices", "1 team member", "Basic reporting"],
  },
  {
    id: "monthly",
    name: "Professional",
    price: "$49",
    period: "per month",
    icon: Building2,
    accent: "text-brand-green",
    ring: "border-brand-green",
    badge: "Most popular",
    features: ["Unlimited contacts", "Unlimited quotes & invoices", "Up to 10 team members", "Full reporting", "Email notifications", "Priority support"],
  },
  {
    id: "yearly",
    name: "Professional Annual",
    price: "$39",
    period: "per month, billed yearly",
    icon: Crown,
    accent: "text-brand-navy",
    ring: "border-brand-navy",
    badge: "Best value",
    features: ["Everything in Professional", "2 months free", "Dedicated onboarding", "Custom branding (coming soon)", "API access (coming soon)"],
  },
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription").then(r => r.json()).then(d => setSubscription(d.subscription)).finally(() => setLoading(false));
  }, []);

  const upgrade = () => {
    toast("Billing integration coming soon — contact support to upgrade.", "info");
  };

  if (loading) return <PageSkeleton />;

  const currentPlan = subscription?.plan ?? "trial";
  const trialEnd = subscription?.trial_ends_at;
  const isActive = subscription?.status === "active" || subscription?.status === "trial";
  const planName = currentPlan === "trial" ? "Free Trial" : currentPlan === "monthly" ? "Professional Monthly" : "Professional Annual";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-desc">Manage your plan and billing</p>
        </div>
      </div>

      {/* Current plan banner */}
      <div className="card px-6 py-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">Current plan</p>
          <p className="text-xl font-bold text-[#111827]">{planName}</p>
          {trialEnd && currentPlan === "trial" && (
            <p className="text-sm text-amber-600 mt-1 font-medium">Trial ends {fmtDate(trialEnd)}</p>
          )}
          {subscription?.renews_at && (
            <p className="text-sm text-[#9CA3AF] mt-1">Renews {fmtDate(subscription.renews_at)}</p>
          )}
        </div>
        <StatusBadge status={subscription?.status ?? "trial"} />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id}
              className={`card border-2 ${isCurrent ? plan.ring : "border-transparent"} flex flex-col transition-all duration-200 hover:shadow-card-md`}>
              <div className="px-6 pt-6 pb-4 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCurrent ? "bg-brand-navy-light" : "bg-[#F3F4F6]"}`}>
                    <Icon size={18} className={isCurrent ? plan.accent : "text-[#9CA3AF]"} />
                  </div>
                  {plan.badge && (
                    <span className="badge bg-brand-navy/10 text-brand-navy text-xs">{plan.badge}</span>
                  )}
                </div>
                <h3 className="font-bold text-base text-[#111827]">{plan.name}</h3>
                <div className="mt-2 mb-5">
                  <span className="text-3xl font-extrabold text-[#111827]">{plan.price}</span>
                  <span className="text-[#9CA3AF] text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                      <Check size={14} className="text-brand-green mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6 mt-4">
                {isCurrent ? (
                  <button disabled className="btn w-full bg-[#F3F4F6] text-[#9CA3AF] cursor-default">
                    Current plan
                  </button>
                ) : plan.id === "trial" ? (
                  <button disabled className="btn w-full bg-[#F3F4F6] text-[#9CA3AF] cursor-default">
                    Downgrade not available
                  </button>
                ) : (
                  <button onClick={upgrade} className="btn btn-green w-full">
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-[#9CA3AF] mt-8">
        Questions? Email us at{" "}
        <a href="mailto:support@clearbuildusa.com" className="text-brand-navy font-medium hover:underline">
          support@clearbuildusa.com
        </a>
      </p>
    </div>
  );
}
