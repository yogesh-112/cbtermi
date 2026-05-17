"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard, AdminTable, AdminTr, AdminTd, MonoId, StatusPill } from "@/components/admin/ui";
import { Building2, Users, TrendingUp, AlertTriangle } from "lucide-react";

interface DashStats {
  totalBusinesses: number; activeSubscriptions: number; trialSubscriptions: number;
  suspendedBusinesses: number; totalUsers: number; bannedUsers: number;
  newUsers7d: number; mrr: number;
}
interface ChartDay { date: string; signups: number; revenue: number }

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [recentBiz, setRecentBiz] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setChartData(d.chartData ?? []);
        setRecentBiz(d.recentBusinesses ?? []);
        setRecentUsers(d.recentUsers ?? []);
      });
  }, []);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
  const maxSig = Math.max(...chartData.map(d => d.signups), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold text-[#0d1117]">Dashboard</h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={14} className="text-[#b33a4b]" />
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Businesses</p>
          </div>
          <p className="text-[28px] font-semibold text-white leading-none">{stats?.totalBusinesses ?? "—"}</p>
          <p className="text-[11px] text-white/30 mt-1">{stats?.suspendedBusinesses ?? 0} suspended</p>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-400" />
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Users</p>
          </div>
          <p className="text-[28px] font-semibold text-white leading-none">{stats?.totalUsers ?? "—"}</p>
          <p className="text-[11px] text-white/30 mt-1">+{stats?.newUsers7d ?? 0} this week</p>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Active Subs</p>
          </div>
          <p className="text-[28px] font-semibold text-white leading-none">{stats?.activeSubscriptions ?? "—"}</p>
          <p className="text-[11px] text-white/30 mt-1">{stats?.trialSubscriptions ?? 0} trialing</p>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">30d Revenue</p>
          </div>
          <p className="text-[28px] font-semibold text-white leading-none">{stats ? fmt(stats.mrr) : "—"}</p>
          <p className="text-[11px] text-white/30 mt-1">{stats?.bannedUsers ?? 0} banned users</p>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue chart */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
            <p className="text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-4">Revenue — 14 Days</p>
            <div className="flex items-end gap-1 h-[80px]">
              {chartData.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div
                    className="w-full bg-[#b33a4b]/60 hover:bg-[#b33a4b] rounded-sm transition-colors"
                    style={{ height: `${Math.max(2, (day.revenue / maxRev) * 72)}px` }}
                    title={`${day.date}: $${day.revenue.toFixed(0)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/20">
              <span>{chartData[0]?.date.slice(5)}</span>
              <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
          {/* Signups chart */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
            <p className="text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-4">Business Signups — 14 Days</p>
            <div className="flex items-end gap-1 h-[80px]">
              {chartData.map(day => (
                <div key={day.date} className="flex-1">
                  <div
                    className="w-full bg-blue-500/50 hover:bg-blue-500/80 rounded-sm transition-colors"
                    style={{ height: `${Math.max(2, (day.signups / maxSig) * 72)}px` }}
                    title={`${day.date}: ${day.signups} signups`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/20">
              <span>{chartData[0]?.date.slice(5)}</span>
              <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent businesses + users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-[#0d1117]">Recent Businesses</p>
            <button onClick={() => router.push("/admin/businesses")} className="text-[12px] text-[#b33a4b] hover:underline">View all</button>
          </div>
          <AdminTable headers={["Business", "Status", "Joined"]}>
            {recentBiz.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-white/25 text-[13px]">No data</td></tr>
            )}
            {recentBiz.map((b: any) => (
              <AdminTr key={b.id} onClick={() => router.push(`/admin/businesses/${b.id}`)}>
                <AdminTd>
                  <div>
                    <p className="text-white font-medium text-[13px]">{b.name}</p>
                    <MonoId id={b.id} prefix="biz" />
                  </div>
                </AdminTd>
                <AdminTd><StatusPill status={b.admin_status ?? "active"} /></AdminTd>
                <AdminTd className="text-[12px] text-white/40">
                  {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTable>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-[#0d1117]">Recent Users</p>
            <button onClick={() => router.push("/admin/users")} className="text-[12px] text-[#b33a4b] hover:underline">View all</button>
          </div>
          <AdminTable headers={["User", "Status", "Joined"]}>
            {recentUsers.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-white/25 text-[13px]">No data</td></tr>
            )}
            {recentUsers.map((u: any) => (
              <AdminTr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)}>
                <AdminTd>
                  <div>
                    <p className="text-white font-medium text-[13px]">{u.name}</p>
                    <p className="text-[11px] text-white/30">{u.email}</p>
                  </div>
                </AdminTd>
                <AdminTd><StatusPill status={u.is_banned ? "banned" : "active"} /></AdminTd>
                <AdminTd className="text-[12px] text-white/40">
                  {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTable>
        </div>
      </div>
    </div>
  );
}
