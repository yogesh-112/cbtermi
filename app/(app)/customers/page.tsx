"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-[#2453E4]","bg-brand-green","bg-brand-navy","bg-[#7C3AED]",
  "bg-[#D97706]","bg-[#DC2626]","bg-[#0D9488]","bg-[#DB2777]",
  "bg-[#0891b2]","bg-[#7c3aed]","bg-[#be185d]","bg-[#16a34a]",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M6 1l1.2 3.6H11L8.2 6.9l1 3.5L6 8.5l-3.2 1.9 1-3.5L1 4.6h3.8z"
            fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"} />
        </svg>
      ))}
      <span className="text-[11px] text-[#8a8fa3] ml-1">{rating > 0 ? rating.toFixed(1) : "—"}</span>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<"grid" | "list">("grid");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/contacts?type=customer")
      .then(r => r.json())
      .then(d => setCustomers(d.contacts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? customers.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const getInitials = (name: string) =>
    name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  /* synthetic stats (no real LTV without joining payments) */
  const addedThisMonth = customers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      <div className="mb-1">
        <h1 className="page-title">Customers</h1>
        <p className="page-desc">{customers.length} customers</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Active customers</span>
          <span className="mini-stat-value">{customers.length}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{addedThisMonth} added this month</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Avg LTV</span>
          <span className="mini-stat-value">—</span>
          <span className="text-[11px] text-brand-green mt-0.5">lifetime value</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Repeat rate</span>
          <span className="mini-stat-value">—</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">2+ projects</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Avg satisfaction</span>
          <span className="mini-stat-value">—</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">from reviews</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        {/* Grid / List toggle */}
        <div className="flex items-center bg-[#f0efea] rounded-lg p-0.5 gap-0.5">
          <button onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              view === "grid" ? "bg-white shadow-sm text-[#0c1226]" : "text-[#8a8fa3] hover:text-[#4a5168]"
            }`}>
            <LayoutGrid size={13} /> Grid
          </button>
          <button onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              view === "list" ? "bg-white shadow-sm text-[#0c1226]" : "text-[#8a8fa3] hover:text-[#4a5168]"
            }`}>
            <List size={13} /> List
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="field w-48 text-[13px]" />
          <button className="btn btn-outline btn-sm gap-1.5">
            <SlidersHorizontal size={13} /> Filters
          </button>
          <Link href="/contacts/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Add customer
          </Link>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-40 animate-pulse skeleton" />)}
        </div>
      )}
      {loading && view === "list" && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="mobile-card h-16 animate-pulse skeleton" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <EmptyState icon={<Users size={40} />} title="No customers yet"
          description="Customers appear here when you convert a lead or create a contact as customer."
          action={<Link href="/contacts/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add Customer</Link>} />
      )}

      {/* Grid view */}
      {!loading && filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, idx) => {
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <Link key={c.id} href={`/contacts/${c.id}`}
                className="card p-5 hover:shadow-card-md transition-all duration-200 block group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-[13px]">{getInitials(c.full_name)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[13px] text-[#0c1226] group-hover:text-brand-navy transition-colors leading-tight">
                        {c.full_name}
                      </p>
                      <p className="text-[11px] text-[#8a8fa3] mt-0.5 truncate max-w-[150px]">{c.email}</p>
                    </div>
                  </div>
                  <button className="text-[#d8d6cf] hover:text-[#8a8fa3] transition-colors" onClick={e => e.preventDefault()}>
                    <span className="text-[18px] leading-none">···</span>
                  </button>
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-[#f0efea]">
                  <div>
                    <p className="text-[10px] text-[#8a8fa3] uppercase tracking-wide mb-0.5">Lifetime</p>
                    <p className="text-[15px] font-bold text-[#0c1226]">—</p>
                    <StarRating rating={0} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8a8fa3] uppercase tracking-wide mb-0.5">Projects</p>
                    <p className="text-[13px] font-semibold text-[#0c1226]">—</p>
                  </div>
                </div>

                {(c.city || c.state) && (
                  <p className="text-[11px] text-[#8a8fa3] mt-2">
                    {[c.city, c.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* List view */}
      {!loading && filtered.length > 0 && view === "list" && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Source</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                        <div className={`w-7 h-7 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-[9px] font-bold">{getInitials(c.full_name)}</span>
                        </div>
                        <span className="font-semibold text-[13px] text-brand-navy hover:underline">{c.full_name}</span>
                      </Link>
                    </td>
                    <td className="text-[13px] text-[#4a5168]">{c.email || "—"}</td>
                    <td className="text-[13px] text-[#4a5168]">{c.phone || "—"}</td>
                    <td className="text-[13px] text-[#4a5168]">
                      {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="text-[12px] text-[#8a8fa3]">{c.source || "—"}</td>
                    <td className="text-[12px] text-[#8a8fa3]">{fmtDate(c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
