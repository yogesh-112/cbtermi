"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt, fmtDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui";
import {
  UserPlus, FileText, Receipt, Briefcase, Bell, ClipboardList,
  TrendingUp, DollarSign, Clock, ArrowRight, BarChart2,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => {
      setStats(d.stats);
      setActivity(d.recentActivity ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { href: "/contacts",     icon: UserPlus,      label: "Add Contact",     color: "bg-brand-navy",        text: "text-white" },
    { href: "/quotes/new",   icon: FileText,       label: "Create Quote",    color: "bg-brand-green",       text: "text-white" },
    { href: "/invoices/new", icon: Receipt,        label: "Create Invoice",  color: "bg-[#2453E4]",         text: "text-white" },
    { href: "/projects",     icon: Briefcase,      label: "New Project",     color: "bg-[#7C3AED]",         text: "text-white" },
    { href: "/notifications",icon: Bell,           label: "Send Message",    color: "bg-[#D97706]",         text: "text-white" },
    { href: "/item-requirements", icon: ClipboardList, label: "Requirements", color: "bg-[#0D9488]",        text: "text-white" },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">Welcome back — here&apos;s your business overview.</p>
        </div>
      </div>

      {/* Key stats — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Active Projects</span>
          <span className="mini-stat-value">{stats?.activeProjects ?? 0}</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Pending Quotes</span>
          <span className="mini-stat-value">{stats?.pendingQuotes ?? 0}</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Outstanding</span>
          <span className="mini-stat-value text-[18px]">{fmt(stats?.outstandingAmount ?? 0)}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Received</span>
          <span className="mini-stat-value text-[18px]">{fmt(stats?.receivedAmount ?? 0)}</span>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt size={15} className="text-brand-navy" />
          </div>
          <div>
            <p className="text-[12px] text-[#8a8fa3] font-medium">Pending Invoices</p>
            <p className="text-[22px] font-semibold text-[#0c1226] leading-tight tabular-nums" style={{ letterSpacing: "-0.02em" }}>
              {stats?.pendingInvoices ?? 0}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart2 size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[12px] text-[#8a8fa3] font-medium">Pending Feedback</p>
            <p className="text-[22px] font-semibold text-[#0c1226] leading-tight tabular-nums" style={{ letterSpacing: "-0.02em" }}>
              {stats?.pendingFeedback ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map(({ href, icon: Icon, label, color, text }) => (
              <Link key={href} href={href}
                className={`${color} ${text} rounded-xl p-3.5 flex flex-col items-start gap-2.5
                            hover:opacity-90 active:scale-[0.97] transition-all duration-150`}>
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <Icon size={15} />
                </div>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Activity</h2>
            <Link href="/communications" className="text-xs text-brand-navy font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 bg-[#f0efea] rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-[#d8d6cf]" />
              </div>
              <p className="text-sm font-medium text-[#4a5168]">No recent activity</p>
              <p className="text-xs text-[#8a8fa3] mt-0.5">Activity will appear here as you use the app.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((a: any, i: number) => (
                <div key={a.id ?? i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f6f6f3] transition-colors">
                  <div className="w-8 h-8 bg-brand-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell size={13} className="text-brand-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0c1226] truncate">{a.subject || a.type}</p>
                    <p className="text-xs text-[#8a8fa3]">{fmtDate(a.created_at)} · {a.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
