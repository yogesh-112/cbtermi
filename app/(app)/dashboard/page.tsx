"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt, fmtDate } from "@/lib/utils";
import { StatCard } from "@/components/ui";
import { UserPlus, FileText, Receipt, Briefcase, Bell, ClipboardList, Activity } from "lucide-react";

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
    { href: "/contacts?new=1",          icon: UserPlus,     label: "Add Contact",        color: "bg-brand-navy" },
    { href: "/quotes?new=1",            icon: FileText,     label: "Create Quote",        color: "bg-brand-green" },
    { href: "/invoices?new=1",          icon: Receipt,      label: "Create Invoice",      color: "bg-blue-600" },
    { href: "/projects?new=1",          icon: Briefcase,    label: "Create Project",      color: "bg-violet-600" },
    { href: "/notifications?new=1",     icon: Bell,         label: "Send Notification",   color: "bg-amber-500" },
    { href: "/item-requirements?new=1", icon: ClipboardList,label: "Item Requirement List", color: "bg-teal-600" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back — here&apos;s what needs your attention.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Active Projects" value={loading ? "…" : stats?.activeProjects ?? 0} color="navy" />
        <StatCard label="Pending Quotes"  value={loading ? "…" : stats?.pendingQuotes ?? 0}  color="navy" />
        <StatCard label="Pending Invoices" value={loading ? "…" : stats?.pendingInvoices ?? 0} color="navy" />
        <StatCard label="Outstanding" value={loading ? "…" : fmt(stats?.outstandingAmount ?? 0)} color="yellow" />
        <StatCard label="Received" value={loading ? "…" : fmt(stats?.receivedAmount ?? 0)} color="green" />
        <StatCard label="Pending Feedback" value={loading ? "…" : stats?.pendingFeedback ?? 0} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}
                className={`${color} text-white rounded-lg p-3 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity text-center`}>
                <Icon size={20} />
                <span className="text-xs font-medium leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title flex items-center gap-2"><Activity size={14} /> Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-7 h-7 bg-brand-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell size={12} className="text-brand-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{a.subject || a.type}</p>
                    <p className="text-xs text-slate-400">{fmtDate(a.created_at)} · {a.channel}</p>
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
