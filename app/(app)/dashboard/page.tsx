"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt, fmtDate } from "@/lib/utils";
import { StatCard, PageSkeleton } from "@/components/ui";
import {
  UserPlus, FileText, Receipt, Briefcase, Bell, ClipboardList,
  TrendingUp, DollarSign, Clock, BarChart2, ArrowRight,
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
    { href: "/contacts?new=1",          icon: UserPlus,      label: "Add Contact",         color: "bg-brand-navy",   text: "text-white" },
    { href: "/quotes?new=1",            icon: FileText,      label: "Create Quote",         color: "bg-brand-green",  text: "text-white" },
    { href: "/invoices?new=1",          icon: Receipt,       label: "Create Invoice",       color: "bg-[#2563EB]",    text: "text-white" },
    { href: "/projects?new=1",          icon: Briefcase,     label: "Create Project",       color: "bg-[#7C3AED]",    text: "text-white" },
    { href: "/notifications?new=1",     icon: Bell,          label: "Send Notification",    color: "bg-[#D97706]",    text: "text-white" },
    { href: "/item-requirements?new=1", icon: ClipboardList, label: "Item Requirements",    color: "bg-[#0D9488]",    text: "text-white" },
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <StatCard
          label="Active Projects"
          value={stats?.activeProjects ?? 0}
          icon={<Briefcase size={16} />}
          color="navy"
        />
        <StatCard
          label="Pending Quotes"
          value={stats?.pendingQuotes ?? 0}
          icon={<FileText size={16} />}
          color="navy"
        />
        <StatCard
          label="Pending Invoices"
          value={stats?.pendingInvoices ?? 0}
          icon={<Receipt size={16} />}
          color="navy"
        />
        <StatCard
          label="Outstanding"
          value={fmt(stats?.outstandingAmount ?? 0)}
          icon={<Clock size={16} />}
          color="yellow"
        />
        <StatCard
          label="Received"
          value={fmt(stats?.receivedAmount ?? 0)}
          icon={<DollarSign size={16} />}
          color="green"
        />
        <StatCard
          label="Feedback"
          value={stats?.pendingFeedback ?? 0}
          icon={<BarChart2 size={16} />}
          color="navy"
        />
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
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">No recent activity</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Activity will appear here as you use the app.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((a: any, i: number) => (
                <div key={a.id ?? i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                  <div className="w-8 h-8 bg-brand-navy-light rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell size={13} className="text-brand-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{a.subject || a.type}</p>
                    <p className="text-xs text-[#9CA3AF]">{fmtDate(a.created_at)} · {a.channel}</p>
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
