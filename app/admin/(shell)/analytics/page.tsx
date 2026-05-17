"use client";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/ui";

function SimpleBarChart({ data, dataKey, color, label }: {
  data: any[]; dataKey: string; color: string; label: string;
}) {
  const max = Math.max(...data.map(d => d[dataKey]), 1);
  return (
    <div>
      <p className="text-[12px] text-[#9399a8] mb-2">{label}</p>
      <div className="flex items-end gap-0.5 h-[80px]">
        {data.map((d, i) => {
          const pct = (d[dataKey] / max) * 100;
          return (
            <div key={i} className="flex-1 flex items-end group relative">
              <div
                className="w-full rounded-t-[2px] transition-all min-h-[2px]"
                style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0d1117] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {d.date}: {dataKey === "revenue" ? `$${(d[dataKey]/100).toFixed(2)}` : d[dataKey]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-[#c0c3cc]">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

function DonutSegments({ data, total }: { data: { label: string; count: number; color: string }[]; total: number }) {
  if (total === 0) return <p className="text-[12px] text-[#9399a8]">No data</p>;
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className="text-[12px] text-[#374151] flex-1">{d.label}</span>
          <span className="text-[12px] font-semibold text-[#0d1117]">{d.count}</span>
          <span className="text-[11px] text-[#9399a8] w-[32px] text-right">
            {total > 0 ? Math.round((d.count / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "#3FA66B",
  trialing: "#3b82f6",
  past_due: "#f59e0b",
  canceled: "#6b7280",
};

const PLAN_COLORS = ["#b33a4b", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#6b7280"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#9399a8] text-[13px]">Loading analytics…</div>;
  if (!data) return <div className="text-center py-16 text-[#9399a8]">Failed to load analytics</div>;

  const totalSubs = (data.statusDistribution ?? []).reduce((s: number, d: any) => s + d.count, 0);
  const totalPlans = (data.planDistribution ?? []).reduce((s: number, d: any) => s + d.count, 0);

  const signupChange = data.signups30dPrev > 0
    ? ((data.signups30d - data.signups30dPrev) / data.signups30dPrev * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-[#0d1117]">Analytics</h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">30-day growth and subscription overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="New Signups (30d)"
          value={data.signups30d ?? 0}
          sub={signupChange ? `${Number(signupChange) >= 0 ? "+" : ""}${signupChange}% vs prev 30d` : "vs prev period"}
        />
        <StatCard
          label="Revenue (90d)"
          value={`$${((data.revenue90d ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="green"
        />
        <StatCard
          label="Active Subscriptions"
          value={(data.statusDistribution ?? []).find((d: any) => d.status === "active")?.count ?? 0}
        />
        <StatCard
          label="Trial Subscriptions"
          value={(data.statusDistribution ?? []).find((d: any) => d.status === "trialing")?.count ?? 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-[#0d1117] mb-4">Daily Signups (30d)</p>
          <SimpleBarChart data={data.chart ?? []} dataKey="signups" color="#b33a4b" label="Businesses registered" />
        </div>
        <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-[#0d1117] mb-4">Daily Revenue (30d)</p>
          <SimpleBarChart data={data.chart ?? []} dataKey="revenue" color="#3FA66B" label="Payment amounts (cents)" />
        </div>
      </div>

      {/* Distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-[#0d1117] mb-1">Subscription Status</p>
          <p className="text-[12px] text-[#9399a8] mb-4">{totalSubs} total subscriptions</p>
          <DonutSegments
            total={totalSubs}
            data={(data.statusDistribution ?? []).map((d: any) => ({
              label: d.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              count: d.count,
              color: STATUS_COLORS[d.status] ?? "#9399a8",
            }))}
          />
        </div>
        <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
          <p className="text-[14px] font-semibold text-[#0d1117] mb-1">Plan Distribution</p>
          <p className="text-[12px] text-[#9399a8] mb-4">{totalPlans} subscriptions across plans</p>
          <DonutSegments
            total={totalPlans}
            data={(data.planDistribution ?? []).map((d: any, i: number) => ({
              label: d.name,
              count: d.count,
              color: PLAN_COLORS[i % PLAN_COLORS.length],
            }))}
          />
        </div>
      </div>

      {/* Revenue table */}
      <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
        <p className="text-[14px] font-semibold text-[#0d1117] mb-4">30-Day Daily Revenue Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f0f1f5]">
                <th className="text-left py-2 pr-4 text-[#9399a8] font-medium">Date</th>
                <th className="text-right py-2 pr-4 text-[#9399a8] font-medium">Signups</th>
                <th className="text-right py-2 text-[#9399a8] font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.chart ?? []).slice().reverse().map((row: any) => (
                <tr key={row.date} className="border-b border-[#f8f9fb] hover:bg-[#fafbfc]">
                  <td className="py-2 pr-4 text-[#374151] font-mono">{row.date}</td>
                  <td className="py-2 pr-4 text-right text-[#374151]">{row.signups}</td>
                  <td className="py-2 text-right text-[#374151]">
                    {row.revenue > 0 ? `$${(row.revenue / 100).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
