"use client";
import { useEffect, useState } from "react";
import { Mail, MessageSquare, Phone, Bell, Search } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const CHANNELS = ["all", "email", "sms", "whatsapp", "notification", "call", "note"];

const channelIcon = (ch: string) => {
  if (ch === "email") return <Mail size={13} />;
  if (ch === "call") return <Phone size={13} />;
  if (ch === "notification") return <Bell size={13} />;
  return <MessageSquare size={13} />;
};

const channelColor: Record<string, string> = {
  email:        "bg-blue-50 text-blue-700",
  sms:          "bg-brand-green-light text-brand-green",
  whatsapp:     "bg-emerald-50 text-emerald-700",
  notification: "bg-violet-50 text-violet-700",
  call:         "bg-amber-50 text-amber-700",
  note:         "bg-[#F3F4F6] text-[#6B7280]",
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/communications").then(r => r.json()).then(d => setLogs(d.logs ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    if (channel !== "all" && l.channel !== channel) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.contacts?.full_name ?? "").toLowerCase().includes(q) ||
        (l.subject ?? "").toLowerCase().includes(q) ||
        (l.message ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Communications</h1>
          <p className="page-desc">{logs.length} total communications</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="input-group flex-1 max-w-sm">
          <Search size={14} className="input-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search communications…" className="field" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`btn btn-sm capitalize ${channel === ch ? "btn-primary" : "btn-outline"}`}>
              {ch}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-16 animate-pulse skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare size={36} />} title="No communication history"
          description="Sent notifications, project updates, and logged calls will appear here." />
      ) : (
        <>
          {/* Mobile timeline */}
          <div className="lg:hidden space-y-3">
            {filtered.map((log: any) => (
              <div key={log.id} className="mobile-card">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-[#111827] text-sm">{log.contacts?.full_name ?? "—"}</p>
                  <span className={`badge capitalize flex items-center gap-1 ${channelColor[log.channel] ?? "bg-[#F3F4F6] text-[#6B7280]"}`}>
                    {channelIcon(log.channel)} {log.channel}
                  </span>
                </div>
                {log.subject && <p className="text-sm font-medium text-[#374151] truncate">{log.subject}</p>}
                {log.message && <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{log.message}</p>}
                <p className="text-xs text-[#9CA3AF] mt-2">{fmtDate(log.created_at)}</p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block table-wrapper">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Channel</th>
                  <th>Type</th>
                  <th>Subject / Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log: any) => (
                  <tr key={log.id}>
                    <td className="font-medium">{log.contacts?.full_name ?? "—"}</td>
                    <td>
                      <span className={`badge capitalize flex items-center gap-1 w-fit ${channelColor[log.channel] ?? "bg-[#F3F4F6] text-[#6B7280]"}`}>
                        {channelIcon(log.channel)} {log.channel}
                      </span>
                    </td>
                    <td><span className="badge bg-[#F3F4F6] text-[#6B7280] capitalize">{log.type ?? "—"}</span></td>
                    <td className="max-w-sm">
                      {log.subject && <p className="font-medium text-[#111827] text-sm truncate">{log.subject}</p>}
                      <p className="text-[#9CA3AF] text-xs truncate">{log.message}</p>
                    </td>
                    <td className="text-[#9CA3AF] text-xs whitespace-nowrap">{fmtDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
