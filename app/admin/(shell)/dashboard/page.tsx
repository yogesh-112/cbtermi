"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTable, AdminTr, AdminTd, MonoId, StatusPill } from "@/components/admin/ui";
import { Building2, Users, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

interface DashStats {
  totalBusinesses: number; activeSubscriptions: number; trialSubscriptions: number;
  suspendedBusinesses: number; totalUsers: number; bannedUsers: number;
  newUsers7d: number; mrr: number;
}
interface ChartDay { date: string; signups: number; revenue: number }

function StatCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: any; iconColor: string;
}) {
  return (
    <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-[#6b7280]">{label}</p>
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-[26px] font-bold text-[#0d1117] leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#9399a8] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [recentBiz, setRecentBiz] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setChartData(d.chartData ?? []);
        setRecentBiz(d.recentBusinesses ?? []);
        setRecentUsers(d.recentUsers ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
  const maxSig = Math.max(...chartData.map(d => d.signups), 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Platform overview</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            {stats ? `${stats.totalBusinesses} businesses · ${stats.totalUsers} users` : "Loading…"}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Businesses" value={stats?.totalBusinesses ?? "—"}
          sub={`${stats?.suspendedBusinesses ?? 0} suspended`}
          icon={Building2} iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Total Users" value={stats?.totalUsers ?? "—"}
          sub={`+${stats?.newUsers7d ?? 0} this week`}
          icon={Users} iconColor="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Active Subscriptions" value={stats?.activeSubscriptions ?? "—"}
          sub={`${stats?.trialSubscriptions ?? 0} on trial`}
          icon={TrendingUp} iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="30-Day Revenue" value={stats ? fmt(stats.mrr) : "—"}
          sub={`${stats?.bannedUsers ?? 0} banned users`}
          icon={AlertCircle} iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
            <p className="text-[13px] font-semibold text-[#0d1117] mb-1">Revenue</p>
            <p className="text-[11px] text-[#9399a8] mb-4">Last 14 days</p>
            <div className="flex items-end gap-1 h-[72px]">
              {chartData.map(day => (
                <div key={day.date} className="flex-1 group relative">
                  <div
                    className="w-full bg-[#b33a4b]/20 hover:bg-[#b33a4b]/60 rounded-sm transition-colors cursor-pointer"
                    style={{ height: `${Math.max(2, (day.revenue / maxRev) * 64)}px` }}
                  />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#0d1117] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {day.date.slice(5)}: ${day.revenue.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#c0c3cc]">
              <span>{chartData[0]?.date.slice(5)}</span>
              <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
            </div>
          </div>

          <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
            <p className="text-[13px] font-semibold text-[#0d1117] mb-1">Business Signups</p>
            <p className="text-[11px] text-[#9399a8] mb-4">Last 14 days</p>
            <div className="flex items-end gap-1 h-[72px]">
              {chartData.map(day => (
                <div key={day.date} className="flex-1 group relative">
                  <div
                    className="w-full bg-blue-200 hover:bg-blue-400 rounded-sm transition-colors cursor-pointer"
                    style={{ height: `${Math.max(2, (day.signups / maxSig) * 64)}px` }}
                  />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#0d1117] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {day.date.slice(5)}: {day.signups}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#c0c3cc]">
              <span>{chartData[0]?.date.slice(5)}</span>
              <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-[#0d1117]">Recent Businesses</p>
            <button onClick={() => router.push("/admin/businesses")} className="text-[12px] text-[#b33a4b] hover:underline font-medium">View all</button>
          </div>
          <AdminTable headers={["Business", "Status", "Joined"]}>
            {recentBiz.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-[#9399a8] text-[13px]">No businesses yet</td></tr>
            )}
            {recentBiz.map((b: any) => (
              <AdminTr key={b.id} onClick={() => router.push(`/admin/businesses/${b.id}`)}>
                <AdminTd>
                  <div>
                    <p className="text-[#0d1117] font-medium text-[13px]">{b.name}</p>
                    <MonoId id={b.id} prefix="biz" />
                  </div>
                </AdminTd>
                <AdminTd><StatusPill status={b.admin_status ?? "active"} /></AdminTd>
                <AdminTd className="text-[12px] text-[#9399a8]">
                  {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTable>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-[#0d1117]">Recent Users</p>
            <button onClick={() => router.push("/admin/users")} className="text-[12px] text-[#b33a4b] hover:underline font-medium">View all</button>
          </div>
          <AdminTable headers={["User", "Status", "Joined"]}>
            {recentUsers.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-[#9399a8] text-[13px]">No users yet</td></tr>
            )}
            {recentUsers.map((u: any) => (
              <AdminTr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)}>
                <AdminTd>
                  <div>
                    <p className="text-[#0d1117] font-medium text-[13px]">{u.name}</p>
                    <p className="text-[11px] text-[#9399a8]">{u.email}</p>
                  </div>
                </AdminTd>
                <AdminTd><StatusPill status={u.is_banned ? "banned" : "active"} /></AdminTd>
                <AdminTd className="text-[12px] text-[#9399a8]">
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
