"use client";
import { useEffect, useState } from "react";
import { Check, Zap, Building2, Crown } from "lucide-react";
import { toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    period: "14 days",
    icon: Zap,
    color: "border-slate-200",
    badge: "",
    features: ["Up to 10 contacts", "5 quotes / invoices", "1 team member", "Basic reporting"],
  },
  {
    id: "monthly",
    name: "Professional",
    price: "$49",
    period: "per month",
    icon: Building2,
    color: "border-brand-green",
    badge: "Most popular",
    features: ["Unlimited contacts", "Unlimited quotes & invoices", "Up to 10 team members", "Full reporting", "Email notifications", "Priority support"],
  },
  {
    id: "yearly",
    name: "Professional Annual",
    price: "$39",
    period: "per month, billed yearly",
    icon: Crown,
    color: "border-brand-navy",
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

  const upgrade = (planId: string) => {
    toast("Billing integration coming soon — contact support to upgrade.", "info");
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;

  const currentPlan = subscription?.plan ?? "trial";
  const trialEnd = subscription?.trial_ends_at;
  const isActive = subscription?.status === "active" || subscription?.status === "trial";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Subscription</h1>
      </div>

      {/* Current plan banner */}
      <div className="card px-6 py-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mb-0.5">Current plan</p>
          <p className="text-xl font-bold text-slate-900 capitalize">{currentPlan === "trial" ? "Free Trial" : currentPlan === "monthly" ? "Professional Monthly" : "Professional Annual"}</p>
          {trialEnd && currentPlan === "trial" && (
            <p className="text-sm text-amber-600 mt-1">Trial ends {fmtDate(trialEnd)}</p>
          )}
          {subscription?.renews_at && (
            <p className="text-sm text-slate-500 mt-1">Renews {fmtDate(subscription.renews_at)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-sm px-3 py-1 ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {subscription?.status ?? "trial"}
          </span>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id} className={`card border-2 ${isCurrent ? plan.color : "border-transparent"} flex flex-col`}>
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className={isCurrent ? "text-brand-green" : "text-slate-400"} />
                  {plan.badge && (
                    <span className="badge bg-brand-navy/10 text-brand-navy text-xs">{plan.badge}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6 mt-auto">
                {isCurrent ? (
                  <button disabled className="btn w-full bg-slate-100 text-slate-400 cursor-default">Current plan</button>
                ) : plan.id === "trial" ? (
                  <button disabled className="btn w-full bg-slate-100 text-slate-400 cursor-default">Downgrade not available</button>
                ) : (
                  <button onClick={() => upgrade(plan.id)} className="btn-green btn w-full">Upgrade to {plan.name}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-400 mt-8">
        Questions? Email us at <span className="text-brand-navy font-medium">support@clearbuildusa.com</span>
      </p>
    </div>
  );
}
