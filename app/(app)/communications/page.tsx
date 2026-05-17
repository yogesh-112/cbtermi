"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Search, Send, Mail, MessageSquare, Phone, ArrowLeft, ExternalLink,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

const CHANNEL_COLOR: Record<string, string> = {
  email:        "bg-blue-50 text-blue-700",
  sms:          "bg-amber-50 text-amber-700",
  whatsapp:     "bg-green-50 text-green-700",
  notification: "bg-violet-50 text-violet-600",
  call:         "bg-orange-50 text-orange-700",
  note:         "bg-[#f0efea] text-[#4a5168]",
};

const ChannelIcon = ({ channel }: { channel: string }) => {
  if (channel === "email") return <Mail size={12} />;
  if (channel === "call") return <Phone size={12} />;
  return <MessageSquare size={12} />;
};

interface Contact {
  id: string;
  full_name: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  channel?: string;
}

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("email");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/communications").then(r => r.json())
      .then(d => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected, logs]);

  const sendMessage = async () => {
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/communications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: selected, channel, message }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) return;
    if (data.link) window.open(data.link, "_blank");
    if (data.log) setLogs(prev => [...prev, data.log]);
    setMessage("");
  };

  // Group logs by contact
  const contactMap = new Map<string, Contact & { logs: any[] }>();
  logs.forEach(log => {
    const cid = log.contact_id ?? "unknown";
    const name = log.contacts?.full_name ?? "Unknown";
    if (!contactMap.has(cid)) {
      contactMap.set(cid, { id: cid, full_name: name, logs: [] });
    }
    const entry = contactMap.get(cid)!;
    entry.logs.push(log);
    if (!entry.lastTime || log.created_at > entry.lastTime) {
      entry.lastMessage = log.subject || log.message || "";
      entry.lastTime = log.created_at;
      entry.channel = log.channel;
    }
  });

  const contacts = [...contactMap.values()].sort((a, b) =>
    (b.lastTime ?? "").localeCompare(a.lastTime ?? "")
  );

  const filtered = contacts.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const tabFilter = (c: Contact & { logs: any[] }) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return (c.unread ?? 0) > 0;
    if (activeTab === "Mentions") return false;
    return true;
  };

  const displayed = filtered.filter(tabFilter);

  const selectedContact = selected ? contactMap.get(selected) : null;
  const thread = selectedContact?.logs.slice().sort((a, b) => a.created_at.localeCompare(b.created_at)) ?? [];

  const getInitials = (name: string) =>
    name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const COLORS = ["bg-brand-navy", "bg-[#2453E4]", "bg-brand-green", "bg-[#7C3AED]", "bg-[#D97706]"];

  return (
    <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6" style={{ height: "calc(100vh - 68px)" }}>
      <div className="flex h-full">
        {/* Contact list panel */}
        <div className={`flex flex-col w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 border-r border-[#e7e6e1] bg-white
          ${mobileView === "chat" ? "hidden lg:flex" : "flex"}`}>
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#e7e6e1]">
            <h1 className="font-bold text-[15px] text-[#0c1226] mb-3" style={{ letterSpacing: "-0.02em" }}>Communications</h1>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="w-full h-8 pl-8 text-[13px] bg-[#f6f6f3] border border-[#e7e6e1] rounded-lg placeholder:text-[#8a8fa3] focus:outline-none focus:ring-2 focus:ring-brand-navy/20" />
            </div>
            <div className="flex gap-1">
              {["All","Unread","Mentions"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-lg transition-colors
                    ${activeTab === t ? "bg-brand-navy text-white" : "text-[#8a8fa3] hover:text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl animate-pulse" />)}
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <MessageSquare size={24} className="text-[#d8d6cf] mb-2" />
                <p className="text-sm text-[#8a8fa3]">No conversations yet</p>
              </div>
            ) : (
              displayed.map((c, idx) => (
                <button key={c.id}
                  onClick={() => { setSelected(c.id); setMobileView("chat"); }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 transition-colors text-left border-b border-[#f6f6f3] last:border-0
                    ${selected === c.id ? "bg-[#eef2ff]" : "hover:bg-[#f6f6f3]"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold
                    ${COLORS[idx % COLORS.length]}`}>
                    {getInitials(c.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-[13px] font-semibold text-[#0c1226] truncate">{c.full_name}</p>
                      <span className="text-[10px] text-[#8a8fa3] whitespace-nowrap flex-shrink-0">{fmtDate(c.lastTime ?? "")}</span>
                    </div>
                    <p className="text-[12px] text-[#8a8fa3] truncate">{c.lastMessage}</p>
                    {c.channel && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded mt-1 ${CHANNEL_COLOR[c.channel] ?? "bg-[#f0efea] text-[#8a8fa3]"}`}>
                        <ChannelIcon channel={c.channel} /> {c.channel}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat / thread panel */}
        <div className={`flex-1 flex flex-col bg-[#f6f6f3] min-w-0
          ${mobileView === "list" ? "hidden lg:flex" : "flex"}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl border border-[#e7e6e1] flex items-center justify-center mb-4 shadow-card">
                <MessageSquare size={26} className="text-[#d8d6cf]" />
              </div>
              <p className="font-semibold text-[#0c1226] mb-1">Select a conversation</p>
              <p className="text-[13px] text-[#8a8fa3]">Choose a contact from the left to view their messages.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#e7e6e1]">
                <button onClick={() => setMobileView("list")} className="lg:hidden -ml-1 mr-1 p-1.5 rounded-lg hover:bg-[#f6f6f3]">
                  <ArrowLeft size={16} className="text-[#4a5168]" />
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0
                  ${COLORS[Math.abs(selected.charCodeAt(0)) % COLORS.length]}`}>
                  {getInitials(selectedContact?.full_name ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-[#0c1226]">{selectedContact?.full_name}</p>
                  <p className="text-[11px] text-[#8a8fa3]">
                    Active on {selectedContact?.channel ?? "email"}
                  </p>
                </div>
                <Link href={`/contacts/${selected}`}
                  className="flex items-center gap-1 text-[12px] text-brand-navy font-medium hover:underline">
                  View contact <ExternalLink size={11} />
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {thread.map((log, i) => {
                  const isOutbound = log.sent_by != null;
                  return (
                    <div key={log.id ?? i} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm
                        ${isOutbound
                          ? "bg-brand-navy text-white rounded-tr-sm"
                          : "bg-white border border-[#e7e6e1] text-[#0c1226] rounded-tl-sm"}`}>
                        {log.subject && (
                          <p className={`text-[11px] font-semibold mb-1 ${isOutbound ? "text-white/70" : "text-[#8a8fa3]"}`}>
                            {log.subject}
                          </p>
                        )}
                        <p className="text-[13px] leading-relaxed">{log.message}</p>
                        <div className={`flex items-center justify-between gap-3 mt-1.5`}>
                          <span className={`text-[10px] ${isOutbound ? "text-white/50" : "text-[#8a8fa3]"} flex items-center gap-1`}>
                            <ChannelIcon channel={log.channel} /> {log.channel}
                          </span>
                          <span className={`text-[10px] ${isOutbound ? "text-white/50" : "text-[#8a8fa3]"}`}>
                            {fmtDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message input */}
              <div className="bg-white border-t border-[#e7e6e1] px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  {["email","whatsapp","sms"].map(ch => (
                    <button key={ch} onClick={() => setChannel(ch)}
                      className={`flex items-center gap-1 text-[12px] px-2 py-1 rounded-lg transition-colors capitalize
                        ${channel === ch ? "bg-brand-navy text-white" : "text-[#8a8fa3] hover:text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                      <ChannelIcon channel={ch} /> {ch}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 h-9 px-3 text-[13px] bg-[#f6f6f3] border border-[#e7e6e1] rounded-lg placeholder:text-[#8a8fa3] focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                  />
                  <button onClick={sendMessage} disabled={!message.trim() || sending}
                    className="w-9 h-9 bg-brand-navy rounded-lg flex items-center justify-center text-white hover:bg-brand-navy/90 transition-colors flex-shrink-0 disabled:opacity-50">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
