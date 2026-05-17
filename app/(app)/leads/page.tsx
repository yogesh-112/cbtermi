"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, UserCheck, Search } from "lucide-react";
import { EmptyState, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-[#2453E4]","bg-brand-green","bg-brand-navy","bg-[#7C3AED]",
  "bg-[#D97706]","bg-[#DC2626]","bg-[#0D9488]","bg-[#DB2777]",
];

const HEAT_MAP: Record<string, { label: string; dot: string; badge: string }> = {
  Hot:  { label: "Hot",  dot: "bg-red-500",    badge: "bg-red-50 text-red-600" },
  Warm: { label: "Warm", dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700" },
  Cold: { label: "Cold", dot: "bg-[#8a8fa3]",   badge: "bg-[#f0efea] text-[#4a5168]" },
};

function getHeat(leadStatus: string): "Hot" | "Warm" | "Cold" {
  if (["New Lead", "In Conversation"].includes(leadStatus)) return "Hot";
  if (["Meeting Scheduled", "Site Visit", "Proposal Sent", "Negotiation", "Quoted"].includes(leadStatus)) return "Warm";
  return "Cold";
}

const STATUS_TABS = [
  { key: "all",        label: "All" },
  { key: "new",        label: "New" },
  { key: "contacted",  label: "Contacted" },
  { key: "quoted",     label: "Quoted" },
  { key: "lost",       label: "Lost" },
];

function statusBucket(s: string) {
  if (["New Lead"].includes(s))                                       return "new";
  if (["In Conversation","Meeting Scheduled","Site Visit"].includes(s)) return "contacted";
  if (["Proposal Sent","Negotiation"].includes(s))                    return "quoted";
  if (["Lost"].includes(s))                                           return "lost";
  return "new";
}

export default function LeadsPage() {
  const [leads, setLeads]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("all");

  const load = () => {
    setLoading(true);
    fetch("/api/contacts?type=lead")
      .then(r => r.json())
      .then(d => setLeads(d.contacts ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const convertToCustomer = async (id: string, name: string) => {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: "customer" }),
    });
    toast(`${name} converted to customer`);
    load();
  };

  /* counts */
  const counts = {
    new:       leads.filter(l => statusBucket(l.lead_status ?? "New Lead") === "new").length,
    contacted: leads.filter(l => statusBucket(l.lead_status ?? "") === "contacted").length,
    quoted:    leads.filter(l => statusBucket(l.lead_status ?? "") === "quoted").length,
    lost:      leads.filter(l => statusBucket(l.lead_status ?? "") === "lost").length,
  };

  /* this week = created in last 7 days */
  const thisWeek = leads.filter(l => {
    const d = new Date(l.created_at);
    return Date.now() - d.getTime() < 7 * 86400000;
  }).length;

  const conversionPct = leads.length
    ? Math.round((leads.filter(l => l.lead_status === "Won").length / leads.length) * 100)
    : 0;

  const filtered = leads.filter(l => {
    if (tab !== "all" && statusBucket(l.lead_status ?? "New Lead") !== tab) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return l.full_name?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s) ||
      l.source?.toLowerCase().includes(s);
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <div className="mb-1">
        <h1 className="page-title">Leads</h1>
        <p className="page-desc">{leads.length} active leads · {thisWeek} new this week</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">New</span>
          <span className="mini-stat-value">{counts.new}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">this week</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Contacted</span>
          <span className="mini-stat-value">{counts.contacted}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">awaiting reply</span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Quoted</span>
          <span className="mini-stat-value">{counts.quoted}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">quote sent</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Conversion · 30d</span>
          <span className="mini-stat-value text-[22px]">{conversionPct}%</span>
          <span className="text-[11px] text-brand-green mt-0.5">vs last period</span>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="tabs-bar mb-0 flex-1">
          {STATUS_TABS.map(t => {
            const count = t.key === "all" ? leads.length : counts[t.key as keyof typeof counts];
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`tab-btn ${tab === t.key ? "active" : ""} flex items-center gap-1.5`}>
                {t.label}
                {(count ?? 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0efea] text-[#8a8fa3]">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="input-group w-52 flex-shrink-0">
          <Search size={13} className="input-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search leads…" className="field" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-20 skeleton" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={<UserCheck size={36} />} title="No leads" description="No leads match your filters."
            action={<Link href="/contacts/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add Lead</Link>} />
        ) : filtered.map((l, idx) => {
          const heat = getHeat(l.lead_status ?? "New Lead");
          const h = HEAT_MAP[heat];
          return (
            <Link key={l.id} href={`/contacts/${l.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
              <div className="mobile-card-row">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{getInitials(l.full_name)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0c1226] text-[13px]">{l.full_name}</p>
                    <p className="text-[11px] text-[#8a8fa3]">{l.email}</p>
                  </div>
                </div>
                <span className={`badge text-[11px] ${h.badge}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${h.dot}`} />
                  {h.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8a8fa3]">
                {l.source && <span>{l.source}</span>}
                {l.lead_status && <span>{l.lead_status}</span>}
                {(l.city || l.state) && <span>{[l.city, l.state].filter(Boolean).join(", ")}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Source</th>
              <th>Heat</th>
              <th>Location</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#8a8fa3]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<UserCheck size={40} />} title="No leads yet" description="Add your first lead."
                  action={<Link href="/contacts/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add Lead</Link>} />
              </td></tr>
            ) : filtered.map((l, idx) => {
              const heat = getHeat(l.lead_status ?? "New Lead");
              const h = HEAT_MAP[heat];
              const location = [l.city, l.state].filter(Boolean).join(", ");
              return (
                <tr key={l.id}>
                  <td>
                    <Link href={`/contacts/${l.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                      <div className={`w-7 h-7 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[9px] font-bold">{getInitials(l.full_name)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#0c1226] text-[13px] hover:text-brand-navy">{l.full_name}</p>
                        <p className="text-[11px] text-[#8a8fa3]">{l.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="text-[13px] text-[#4a5168]">{l.source || "—"}</td>
                  <td>
                    <span className={`badge text-[11px] ${h.badge}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${h.dot}`} />
                      {h.label}
                    </span>
                  </td>
                  <td className="text-[13px] text-[#4a5168]">{location || "—"}</td>
                  <td>
                    <span className="text-[12px] text-[#4a5168]">{l.lead_status || "New Lead"}</span>
                  </td>
                  <td className="text-[12px] text-[#8a8fa3]">{fmtDate(l.created_at)}</td>
                  <td>
                    <button
                      onClick={() => convertToCustomer(l.id, l.full_name)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-brand-navy border border-brand-navy/30 rounded-lg hover:bg-[#eef2ff] transition-colors">
                      <UserCheck size={11} /> Convert
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
