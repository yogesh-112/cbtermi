"use client";
import { useEffect, useState } from "react";
import { Mail, MessageSquare, Phone, Bell, Filter } from "lucide-react";
import { fmtDate } from "@/lib/utils";

const CHANNELS = ["all", "email", "sms", "whatsapp", "notification", "call", "note"];

const channelIcon = (ch: string) => {
  if (ch === "email") return <Mail size={13} />;
  if (ch === "call") return <Phone size={13} />;
  if (ch === "notification") return <Bell size={13} />;
  return <MessageSquare size={13} />;
};

const channelColor: Record<string, string> = {
  email: "bg-blue-100 text-blue-700",
  sms: "bg-green-100 text-green-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  notification: "bg-purple-100 text-purple-700",
  call: "bg-orange-100 text-orange-700",
  note: "bg-slate-100 text-slate-600",
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
        <h1 className="page-title">Communications</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search communications…"
          className="field max-w-xs"
        />
        <div className="flex items-center gap-1 flex-wrap">
          {CHANNELS.map(ch => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={`btn btn-sm capitalize ${channel === ch ? "btn-primary" : "btn-ghost"}`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No communication history</p>
          <p className="text-sm">Sent notifications, project updates, and logged calls will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
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
                    <span className={`badge capitalize flex items-center gap-1 w-fit ${channelColor[log.channel] ?? "bg-slate-100 text-slate-600"}`}>
                      {channelIcon(log.channel)} {log.channel}
                    </span>
                  </td>
                  <td><span className="badge bg-slate-100 text-slate-500 capitalize">{log.type ?? "—"}</span></td>
                  <td className="max-w-sm">
                    {log.subject && <p className="font-medium text-slate-800 text-sm truncate">{log.subject}</p>}
                    <p className="text-slate-500 text-xs truncate">{log.message}</p>
                  </td>
                  <td className="text-slate-400 text-xs whitespace-nowrap">{fmtDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
