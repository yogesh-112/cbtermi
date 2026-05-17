"use client";
import { useEffect, useState } from "react";
import { Check, Zap, Building2, Crown, CreditCard } from "lucide-react";
import { toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const PLANS = {
  monthly: [
    {
      id: "solo_monthly",
      name: "Solo",
      price: 19,
      desc: "For one-person shops getting started.",
      features: ["Up to 1 user", "20 active projects", "Basic invoicing"],
      popular: false,
      current: false,
    },
    {
      id: "pro_monthly",
      name: "Pro",
      price: 49,
      desc: "Most popular for small crews.",
      features: ["Up to 10 users", "Unlimited projects", "AI quote drafts", "WhatsApp", "Integrations"],
      popular: true,
      current: true,
    },
    {
      id: "business_monthly",
      name: "Business",
      price: 129,
      desc: "For multi-crew companies.",
      features: ["Unlimited users", "Multi-business", "Custom branding", "Dedicated support", "SSO"],
      popular: false,
      current: false,
    },
  ],
  yearly: [
    {
      id: "solo_yearly",
      name: "Solo",
      price: 15,
      desc: "For one-person shops getting started.",
      features: ["Up to 1 user", "20 active projects", "Basic invoicing"],
      popular: false,
      current: false,
    },
    {
      id: "pro_yearly",
      name: "Pro",
      price: 39,
      desc: "Most popular for small crews.",
      features: ["Up to 10 users", "Unlimited projects", "AI quote drafts", "WhatsApp", "Integrations"],
      popular: true,
      current: false,
    },
    {
      id: "business_yearly",
      name: "Business",
      price: 99,
      desc: "For multi-crew companies.",
      features: ["Unlimited users", "Multi-business", "Custom branding", "Dedicated support", "SSO"],
      popular: false,
      current: false,
    },
  ],
};

const BILLING_HISTORY = [
  { plan: "Pro · monthly", date: "Dec 5, 2026", amount: 49, status: "Paid" },
  { plan: "Pro · monthly", date: "Nov 5, 2026", amount: 49, status: "Paid" },
  { plan: "Solo · monthly", date: "Oct 5, 2026", amount: 19, status: "Paid" },
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    fetch("/api/subscription").then(r => r.json())
      .then(d => setSubscription(d.subscription))
      .finally(() => setLoading(false));
  }, []);

  const upgrade = () => {
    toast("Billing integration coming soon — contact support to upgrade.", "info");
  };

  if (loading) return <PageSkeleton />;

  const trialEnd = subscription?.trial_ends_at;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))
    : null;

  const plans = PLANS[billing];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Subscription</h1>
        <p className="page-desc">You're on Pro · trial ends Jun 5</p>
      </div>

      {/* Trial banner */}
      {daysLeft != null && (
        <div className="card p-5 bg-gradient-to-r from-brand-navy to-[#1a3a6b] text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1 block">TRIAL · PRO</span>
              <p className="text-[20px] font-bold" style={{ letterSpacing: "-0.02em" }}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
              </p>
              <p className="text-[13px] text-white/60 mt-1">Pick a plan now and we'll start charging when the trial ends. Cancel any time.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBilling("monthly")}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${billing === "monthly" ? "bg-white text-brand-navy" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                Monthly
              </button>
              <button onClick={() => setBilling("yearly")}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${billing === "yearly" ? "bg-white text-brand-navy" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                Yearly <span className="text-[10px] bg-brand-green text-white px-1.5 py-0.5 rounded">save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly/Yearly toggle (if not in trial) */}
      {daysLeft == null && (
        <div className="flex items-center gap-1 p-1 bg-[#f6f6f3] border border-[#e7e6e1] rounded-xl w-fit">
          <button onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-colors ${billing === "monthly" ? "bg-white text-[#0c1226] shadow-sm" : "text-[#8a8fa3] hover:text-[#4a5168]"}`}>
            Monthly
          </button>
          <button onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${billing === "yearly" ? "bg-white text-[#0c1226] shadow-sm" : "text-[#8a8fa3] hover:text-[#4a5168]"}`}>
            Yearly <span className="text-[10px] bg-brand-green text-white px-1.5 py-0.5 rounded">save</span>
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = plan.current;
          return (
            <div key={plan.id}
              className={`card flex flex-col relative transition-all duration-200 hover:shadow-card-md
                ${isCurrent ? "border-2 border-brand-navy" : "border border-[#e7e6e1]"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-navy text-white text-[11px] font-semibold px-3 py-1 rounded-full">MOST</span>
                </div>
              )}
              <div className="px-6 pt-6 pb-4 flex-1">
                <p className="font-bold text-[15px] text-[#0c1226] mb-0.5">{plan.name}</p>
                <p className="text-[12px] text-[#8a8fa3] mb-4">{plan.desc}</p>
                <div className="mb-5">
                  <span className="text-[32px] font-extrabold text-[#0c1226]" style={{ letterSpacing: "-0.03em"}}>${plan.price}</span>
                  <span className="text-[#8a8fa3] text-[13px] ml-1">/ mo</span>
                  {billing === "yearly" && (
                    <p className="text-[11px] text-[#8a8fa3] mt-0.5">billed yearly · per business</p>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[#4a5168]">
                      <Check size={13} className="text-brand-green mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6 mt-2">
                {isCurrent ? (
                  <button className="btn w-full bg-brand-navy text-white" onClick={() => toast("Manage billing coming soon", "info")}>
                    Keep current plan
                  </button>
                ) : (
                  <button onClick={upgrade}
                    className={`btn w-full ${plan.popular && !isCurrent ? "btn-outline border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white" : "btn-outline"}`}>
                    {plan.price > 49 ? "Upgrade" : "Downgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Usage this month */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Usage this month</h2>
          <div className="space-y-3.5">
            {[
              { label: "Active",  value: 7,   max: null, unit: "/ unlimited" },
              { label: "Team",    value: 5,   max: 10,   unit: "/ 10" },
              { label: "SMS messages", value: 142, max: 500, unit: "/ 500" },
            ].map(({ label, value, max, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-[#4a5168] font-medium">{label}</span>
                  <span className="text-[#0c1226] font-semibold">{value} <span className="text-[#8a8fa3] font-normal">{unit}</span></span>
                </div>
                {max != null && (
                  <div className="h-1.5 bg-[#f0efea] rounded-full overflow-hidden">
                    <div className="h-full bg-brand-navy rounded-full transition-all"
                      style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing history */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Billing history</h2>
          <div className="space-y-0.5">
            {BILLING_HISTORY.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#f0efea] last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-[#0c1226]">{row.plan}</p>
                  <p className="text-[11px] text-[#8a8fa3]">{row.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#0c1226]">${row.amount}.00</span>
                  <span className="text-[11px] text-brand-green font-medium">· {row.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => toast("Download receipts coming soon", "info")}
            className="btn btn-outline btn-sm w-full mt-4">
            <CreditCard size={13} /> Manage billing
          </button>
        </div>
      </div>
    </div>
  );
}
