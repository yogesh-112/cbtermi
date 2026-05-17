"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, GitPullRequestDraft, MoreHorizontal } from "lucide-react";
import { EmptyState, StatusBadge, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f0efea] text-[#4a5168]",
  sent: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  converted: "bg-purple-50 text-purple-700",
};

export default function ChangeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/change-orders").then(r => r.json()).then(d => setOrders(d.changeOrders ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const total = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const draft = orders.filter(o => o.status === "draft").length;
  const pending = orders.filter(o => o.status === "sent").length;
  const approved = orders.filter(o => o.status === "approved").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="page-title">Change Orders</h1>
          <p className="page-desc">{fmt(total)} total value · {orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/change-orders/new" className="btn btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={13} strokeWidth={2.5} /> New order
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Draft</span>
          <span className="mini-stat-value">{draft}</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Awaiting approval</span>
          <span className="mini-stat-value">{pending}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Approved</span>
          <span className="mini-stat-value">{approved}</span>
        </div>
      </div>

      <div className="table-wrapper hidden lg:block">
        <table className="table-base">
          <thead>
            <tr>
              <th>CO #</th>
              <th>Title</th>
              <th>Project</th>
              <th>Contact</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#8a8fa3]">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<GitPullRequestDraft size={40} />} title="No change orders yet"
                  description="Create your first change order to track scope changes on a project."
                  action={<Link href="/change-orders/new" className="btn btn-primary btn-sm">New Change Order</Link>} />
              </td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="cursor-pointer" onClick={() => window.location.href = `/change-orders/${o.id}`}>
                <td className="font-mono text-[12px] font-medium text-brand-navy">{o.co_number}</td>
                <td className="text-[13px] font-medium text-[#0c1226]">{o.title || "—"}</td>
                <td className="text-[13px] text-[#4a5168]">{o.projects?.name || "—"}</td>
                <td className="text-[13px] text-[#4a5168]">{o.contacts?.full_name || "—"}</td>
                <td className="font-semibold text-[13px] text-[#0c1226]">{fmt(o.total)}</td>
                <td>
                  <span className={`badge text-[11px] font-medium capitalize ${STATUS_COLORS[o.status] ?? ""}`}>
                    {o.status}
                  </span>
                </td>
                <td className="text-[12px] text-[#8a8fa3]">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-20 skeleton" />)
        ) : orders.length === 0 ? (
          <EmptyState icon={<GitPullRequestDraft size={36} />} title="No change orders yet"
            description="Create your first change order."
            action={<Link href="/change-orders/new" className="btn btn-primary btn-sm">New Change Order</Link>} />
        ) : orders.map(o => (
          <Link key={o.id} href={`/change-orders/${o.id}`} className="mobile-card block">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#0c1226]">{o.co_number} {o.title ? `— ${o.title}` : ""}</p>
                <p className="text-xs text-[#8a8fa3] mt-0.5">{o.contacts?.full_name || "No contact"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#0c1226]">{fmt(o.total)}</p>
                <span className={`badge text-[10px] mt-1 capitalize ${STATUS_COLORS[o.status] ?? ""}`}>{o.status}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
