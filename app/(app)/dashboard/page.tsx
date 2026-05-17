"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt, fmtDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui";
import {
  TrendingUp, TrendingDown, ArrowRight, FileText, Receipt,
  CreditCard, Users, DollarSign, Clock, CheckCircle,
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-end gap-[3px] h-8">
      {[0.4, 0.6, 0.75, 0.85, 0.9, 1.0, pct / 100].map((h, i) => (
        <div key={i} className={`w-2 rounded-sm ${i === 6 ? color : "bg-[#e7e6e1]"}`}
          style={{ height: `${Math.max(h * 100, 15)}%` }} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/invoices").then(r => r.json()),
    ]).then(([dash, me, inv]: [any, any, any]) => {
      setStats(dash.stats);
      setActivity(dash.recentActivity ?? []);
      setChartData(dash.chartData ?? []);
      setUserName(me?.user?.name ?? me?.user?.full_name ?? "");
      const invs: any[] = inv.invoices ?? [];
      setOutstandingInvoices(invs.filter(i => (i.amount_due ?? 0) > 0).slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { href: "/contacts/new",   icon: Users,      label: "New Contact",   bg: "bg-brand-navy" },
    { href: "/quotes/new",     icon: FileText,   label: "New Quote",     bg: "bg-[#2453E4]" },
    { href: "/invoices/new",   icon: Receipt,    label: "New Invoice",   bg: "bg-brand-green" },
    { href: "/payments",       icon: CreditCard, label: "Payments",      bg: "bg-[#7C3AED]" },
  ];

  if (loading) return <PageSkeleton />;

  const firstName = userName.split(" ")[0] || "there";
  const outstanding = stats?.outstandingAmount ?? 0;
  const received = stats?.receivedAmount ?? 0;
  const activeProjects = stats?.activeProjects ?? 0;
  const pendingQuotes = stats?.pendingQuotes ?? 0;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-[26px] font-bold text-[#0c1226] leading-tight" style={{ letterSpacing: "-0.025em" }}>
          {getGreeting()}, {firstName}.
        </h1>
        <p className="text-[14px] text-[#8a8fa3] mt-0.5">
          {pendingQuotes > 0 ? `${pendingQuotes} quote${pendingQuotes !== 1 ? "s" : ""} awaiting approval` : "Here's your business overview for today."}
        </p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="mini-stat mini-stat-rose">
          <span className="mini-stat-label">Outstanding invoices</span>
          <span className="mini-stat-value text-[20px]">{fmt(outstanding)}</span>
          <span className="text-[11px] text-[#8a8fa3] flex items-center gap-1 mt-0.5">
            <TrendingUp size={11} className="text-brand-green" /> {stats?.pendingInvoices ?? 0} open invoices
          </span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Quotes pending</span>
          <span className="mini-stat-value">{pendingQuotes}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">awaiting approval</span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Active projects</span>
          <span className="mini-stat-value">{activeProjects}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">in progress</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Paid this period</span>
          <span className="mini-stat-value text-[20px]">{fmt(received)}</span>
          <span className="text-[11px] text-brand-green flex items-center gap-1 mt-0.5">
            <TrendingUp size={11} /> total received
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cash in & out chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title mb-0">Cash in &amp; out</h2>
              <p className="text-[12px] text-[#8a8fa3] mt-0.5">Daily collected vs invoiced — last 14 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8a8fa3]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-navy inline-block" /> Invoiced</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-green inline-block" /> Paid</span>
            </div>
          </div>
          {/* Real bar chart */}
          {(() => {
            const maxVal = Math.max(...chartData.map(d => Math.max(d.invoiced, d.paid)), 1);
            const startLabel = chartData[0]?.date ? new Date(chartData[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            const midLabel = chartData[6]?.date ? new Date(chartData[6].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            const endLabel = chartData[13]?.date ? new Date(chartData[13].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            return (
              <>
                <div className="flex items-end gap-1.5 h-32 w-full">
                  {(chartData.length ? chartData : Array.from({ length: 14 }, () => ({ invoiced: 0, paid: 0 }))).map((d: any, i: number) => {
                    const invH = Math.max((d.invoiced / maxVal) * 100, d.invoiced > 0 ? 4 : 0);
                    const paidH = Math.max((d.paid / maxVal) * 100, d.paid > 0 ? 4 : 0);
                    return (
                      <div key={i} className="flex-1 flex items-end gap-0.5 h-full group relative">
                        <div className="flex-1 rounded-t bg-brand-navy/20 hover:bg-brand-navy/30 transition-colors"
                          style={{ height: invH > 0 ? `${invH}%` : "3px" }} />
                        <div className="flex-1 rounded-t bg-brand-green hover:bg-brand-green/80 transition-colors"
                          style={{ height: paidH > 0 ? `${paidH}%` : "3px" }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-[#8a8fa3] mt-2">
                  <span>{startLabel}</span><span>{midLabel}</span><span>{endLabel}</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Pending actions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Pending actions</h2>
            {activity.length > 0 && (
              <span className="text-[11px] text-[#8a8fa3]">{activity.slice(0, 5).length} items</span>
            )}
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={24} className="text-brand-green mb-2" />
              <p className="text-sm font-medium text-[#0c1226]">All caught up!</p>
              <p className="text-xs text-[#8a8fa3] mt-0.5">No pending actions right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 5).map((a: any, i: number) => (
                <div key={a.id ?? i} className="flex items-start gap-2.5 py-2 border-b border-[#f0efea] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0c1226] truncate">{a.subject || a.type}</p>
                    <p className="text-[11px] text-[#8a8fa3] truncate">{a.contacts?.full_name ?? a.channel}</p>
                  </div>
                  <span className="text-[11px] text-[#8a8fa3] whitespace-nowrap flex-shrink-0">{fmtDate(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent activity */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent activity</h2>
            <Link href="/communications" className="text-xs text-brand-navy font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 bg-[#f0efea] rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-[#d8d6cf]" />
              </div>
              <p className="text-sm font-medium text-[#4a5168]">No recent activity</p>
              <p className="text-xs text-[#8a8fa3] mt-0.5">Activity will appear here as you use the app.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 6).map((a: any, i: number) => {
                const name = a.contacts?.full_name;
                const initials = name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                return (
                  <div key={a.id ?? i}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f6f3] transition-colors">
                    <div className="w-7 h-7 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0c1226] truncate">
                        {name && <span className="font-semibold">{name}</span>}
                        {name ? ", " : ""}{a.subject || a.type}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#8a8fa3] whitespace-nowrap">{fmtDate(a.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outstanding invoices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Outstanding</h2>
            <Link href="/invoices" className="text-xs text-brand-navy font-medium hover:underline">All invoices</Link>
          </div>
          {outstandingInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={24} className="text-brand-green mb-2" />
              <p className="text-sm font-medium text-[#0c1226]">No outstanding invoices</p>
              <p className="text-xs text-[#8a8fa3] mt-0.5">All invoices are paid up.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outstandingInvoices.map((inv: any) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}
                  className="block py-2.5 border-b border-[#f0efea] last:border-0 hover:bg-[#f6f6f3] -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0c1226] truncate">
                        {inv.contacts?.full_name || inv.invoice_number}
                      </p>
                      <p className="text-[11px] text-[#8a8fa3]">{inv.invoice_number}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#0c1226] whitespace-nowrap">{fmt(inv.amount_due)}</span>
                  </div>
                  {inv.due_date && (
                    <p className={`text-[11px] mt-0.5 ${new Date(inv.due_date) < new Date() ? "text-red-500" : "text-[#8a8fa3]"}`}>
                      Due {fmtDate(inv.due_date)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
          {outstanding > 0 && (
            <div className="mt-3 pt-3 border-t border-[#e7e6e1] flex justify-between items-center">
              <span className="text-[12px] text-[#8a8fa3]">Total outstanding</span>
              <span className="text-[14px] font-bold text-[#0c1226]">{fmt(outstanding)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ href, icon: Icon, label, bg }) => (
            <Link key={href} href={href}
              className={`${bg} text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 active:scale-[0.97] transition-all`}>
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={15} />
              </div>
              <span className="text-[13px] font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
