"use client";
import { useEffect, useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronUp, Search, AlertCircle, Ticket,
  ChevronRight, Plus, X, Paperclip, Send, RefreshCw, ExternalLink,
  PlayCircle,
} from "lucide-react";
import {
  Modal, ConfirmDialog, EmptyState, Spinner, toast, Tabs, FormField, SearchInput,
} from "@/components/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n";

const TICKET_CATEGORIES = ["Account/Login","Billing/Subscription","Bug","Feature Request","Quotes","Invoices","Projects","Payments","Team","Other"];
const TICKET_PRIORITIES = ["low","medium","high","urgent"];
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  "in_progress": "bg-amber-100 text-amber-700",
  "waiting_for_user": "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const TUTORIALS = [
  { id: "1", title: "Getting Started with Clear Build", topic: "Onboarding", duration: "3:45", youtubeId: "dQw4w9WgXcQ" },
  { id: "2", title: "Creating and Sending Quotes",      topic: "Quotes",    duration: "5:20", youtubeId: "dQw4w9WgXcQ" },
  { id: "3", title: "Managing Projects and Milestones", topic: "Projects",  duration: "4:10", youtubeId: "dQw4w9WgXcQ" },
  { id: "4", title: "Recording Payments and Invoices",  topic: "Billing",   duration: "3:55", youtubeId: "dQw4w9WgXcQ" },
  { id: "5", title: "Using the Scheduling Module",      topic: "Scheduling",duration: "4:30", youtubeId: "dQw4w9WgXcQ" },
  { id: "6", title: "Tracking Expenses on Projects",    topic: "Expenses",  duration: "2:50", youtubeId: "dQw4w9WgXcQ" },
];

export default function HelpPage() {
  const t = useT();
  const [tab, setTab] = useState<"faq"|"issues"|"tickets"|"tutorials">("faq");
  const [activeTutorial, setActiveTutorial] = useState<typeof TUTORIALS[0] | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [openIssue, setOpenIssue] = useState<string | null>(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [viewTicket, setViewTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "Bug", priority: "medium", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/help/faqs").then(r => r.json()),
      fetch("/api/help/common-issues").then(r => r.json()),
      fetch("/api/support/tickets").then(r => r.json()),
    ]).then(([f, i, t]) => {
      setFaqs(f.faqs ?? []);
      setIssues(i.issues ?? []);
      setTickets(t.tickets ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const faqCategories = ["All", ...Array.from(new Set(faqs.map((f: any) => f.category)))];

  const filteredFaqs = faqs.filter(f => {
    const matchCat = activeCategory === "All" || f.category === activeCategory;
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const groupedFaqs: Record<string, any[]> = {};
  for (const faq of filteredFaqs) {
    if (!groupedFaqs[faq.category]) groupedFaqs[faq.category] = [];
    groupedFaqs[faq.category].push(faq);
  }

  const openTicketDetail = async (ticket: any) => {
    setViewTicket(ticket);
    const res = await fetch(`/api/support/tickets/${ticket.id}`);
    const d = await res.json();
    setTicketMessages(d.messages ?? []);
  };

  const submitTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast("Subject and description are required", "error"); return; }
    setSubmitting(true);
    const res = await fetch("/api/support/tickets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setTickets(prev => [d.ticket, ...prev]);
      setTicketModal(false);
      setForm({ subject: "", category: "Bug", priority: "medium", description: "" });
      toast("Ticket submitted successfully", "success");
    } else {
      toast(d.message ?? "Failed to submit ticket", "error");
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !viewTicket) return;
    setSending(true);
    const res = await fetch(`/api/support/tickets/${viewTicket.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText }),
    });
    const d = await res.json();
    setSending(false);
    if (res.ok) {
      setTicketMessages(prev => [...prev, d.message]);
      setReplyText("");
    } else {
      toast(d.message ?? "Failed to send reply", "error");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.help.title}</h1>
          <p className="page-desc">{t.help.subtitle}</p>
        </div>
        <button onClick={() => setTicketModal(true)} className="btn btn-primary">
          <Ticket size={15} /> {t.help.raiseTicket}
        </button>
      </div>

      <Tabs
        tabs={[
          { id: "faq",       label: t.help.tabFaq },
          { id: "tutorials", label: t.help.tabTutorials },
          { id: "issues",    label: t.help.tabIssues },
          { id: "tickets",   label: `${t.help.tabTickets} (${tickets.length})` },
        ]}
        active={tab}
        onChange={(id) => setTab(id as any)}
      />

      {/* FAQ Tab */}
      {tab === "faq" && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder={t.help.searchFaqs} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {faqCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#123B5D] text-white"
                    : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#123B5D] hover:text-[#123B5D]"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {Object.keys(groupedFaqs).length === 0 && (
            <EmptyState icon={HelpCircle} title={t.help.noFaqs} description={t.help.noFaqsDesc} />
          )}

          {Object.entries(groupedFaqs).map(([cat, items]) => (
            <div key={cat} className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
                <h3 className="font-semibold text-[#123B5D] text-[13px] uppercase tracking-wide">{cat}</h3>
              </div>
              <div className="divide-y divide-[#f3f4f6]">
                {items.map(faq => (
                  <div key={faq.id}>
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors">
                      <span className="font-medium text-[14px] text-[#1f2937] flex-1">{faq.question}</span>
                      {openFaq === faq.id ? <ChevronUp size={16} className="text-[#6b7280] mt-0.5 flex-shrink-0" /> : <ChevronDown size={16} className="text-[#6b7280] mt-0.5 flex-shrink-0" />}
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-5 pb-4 text-[14px] text-[#4b5563] leading-relaxed bg-[#fafafa] border-t border-[#f3f4f6]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tutorials Tab */}
      {tab === "tutorials" && (
        <div className="mt-5">
          {activeTutorial ? (
            <div>
              <button onClick={() => setActiveTutorial(null)}
                className="flex items-center gap-1.5 text-[13px] text-[#8a8fa3] hover:text-brand-navy mb-4 transition-colors">
                {t.help.backToTutorials}
              </button>
              <div className="card overflow-hidden mb-4">
                <div className="aspect-video w-full bg-[#000]">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeTutorial.youtubeId}?autoplay=1`}
                    title={activeTutorial.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[16px] text-[#0c1226]">{activeTutorial.title}</h3>
                  <p className="text-[12px] text-[#8a8fa3] mt-1">{activeTutorial.topic} · {activeTutorial.duration}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TUTORIALS.map(tut => (
                <button key={tut.id} onClick={() => setActiveTutorial(tut)}
                  className="card p-0 overflow-hidden text-left hover:shadow-md transition-shadow group">
                  <div className="aspect-video bg-gradient-to-br from-brand-navy to-[#2453E4] flex items-center justify-center relative">
                    <PlayCircle size={40} className="text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-1.5 py-0.5 rounded">
                      {tut.duration}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[10px] font-semibold text-brand-navy bg-brand-navy/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {tut.topic}
                    </span>
                    <p className="text-[13px] font-semibold text-[#0c1226] mt-2 leading-tight">{tut.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Common Issues Tab */}
      {tab === "issues" && (
        <div className="mt-5 space-y-4">
          {issues.map(issue => (
            <div key={issue.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenIssue(openIssue === issue.id ? null : issue.id)}
                className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle size={17} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold text-[14px] text-[#1f2937]">{issue.title}</span>
                </div>
                {openIssue === issue.id ? <ChevronUp size={16} className="text-[#6b7280] mt-1 flex-shrink-0" /> : <ChevronDown size={16} className="text-[#6b7280] mt-1 flex-shrink-0" />}
              </button>
              {openIssue === issue.id && (
                <div className="px-5 pb-5 border-t border-[#f3f4f6] bg-[#fafafa]">
                  <p className="text-[13px] text-[#6b7280] mt-3 mb-3 italic">{issue.reason}</p>
                  <ol className="space-y-2">
                    {issue.steps.map((step: string, i: number) => (
                      <li key={i} className="flex gap-2.5 text-[14px] text-[#374151]">
                        <span className="w-5 h-5 rounded-full bg-[#123B5D] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {issue.action && (
                    <div className="mt-4">
                      <Link href={issue.action.href} className="btn btn-outline btn-sm">
                        {issue.action.label} <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tickets Tab */}
      {tab === "tickets" && (
        <div className="mt-5">
          {tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={t.help.noTickets}
              description={t.help.noTicketsDesc}
              action={{ label: t.help.raiseTicket, onClick: () => setTicketModal(true) }}
            />
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="card card-hover p-4 cursor-pointer" onClick={() => openTicketDetail(ticket)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-[#1f2937] truncate">{ticket.subject}</p>
                      <p className="text-[12px] text-[#6b7280] mt-0.5">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[ticket.status]}`}>{ticket.status.replace("_"," ")}</span>
                      <ChevronRight size={15} className="text-[#9ca3af]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raise Ticket Modal */}
      <Modal open={ticketModal} onClose={() => setTicketModal(false)} title={t.help.raiseTicketTitle} size="md">
        <div className="space-y-4">
          <FormField label={t.help.subjectLabel}>
            <input className="field" placeholder={t.help.subjectPlaceholder} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
          </FormField>
          <div className="form-row">
            <FormField label={t.help.categoryLabel}>
              <select className="field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label={t.help.priorityLabel}>
              <select className="field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label={t.help.descriptionLabel}>
            <textarea className="field min-h-[120px]" placeholder={t.help.descriptionPlaceholder} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-outline" onClick={() => setTicketModal(false)}>{t.help.cancelBtn}</button>
            <button className="btn btn-primary" onClick={submitTicket} disabled={submitting}>
              {submitting ? <><Spinner size={16} /> {t.help.submitting}</> : <><Send size={14} /> {t.help.submitBtn}</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Ticket Modal */}
      <Modal open={!!viewTicket} onClose={() => { setViewTicket(null); setTicketMessages([]); }} title={viewTicket?.subject ?? "Ticket"} size="lg">
        {viewTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className={`px-2 py-1 rounded-full font-medium ${STATUS_COLORS[viewTicket.status]}`}>Status: {viewTicket.status.replace("_"," ")}</span>
              <span className={`px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[viewTicket.priority]}`}>Priority: {viewTicket.priority}</span>
              <span className="px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">Category: {viewTicket.category}</span>
            </div>
            <div className="bg-[#f9fafb] rounded-xl p-4 text-[14px] text-[#374151] whitespace-pre-wrap">{viewTicket.description}</div>

            {ticketMessages.length > 0 && (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                <p className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide">Replies</p>
                {ticketMessages.map((msg: any) => (
                  <div key={msg.id} className={`p-3 rounded-xl text-[13px] ${msg.is_admin ? "bg-[#f0fdf4] border border-green-100 ml-4" : "bg-[#f3f4f6]"}`}>
                    <p className="font-medium text-[#1f2937] mb-1">{msg.is_admin ? "Support Team" : "You"}</p>
                    <p className="text-[#374151] whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-[11px] text-[#9ca3af] mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {viewTicket.status !== "closed" && viewTicket.status !== "resolved" && (
              <div className="flex gap-2 pt-2 border-t border-[#f3f4f6]">
                <textarea
                  className="field flex-1 min-h-[72px] resize-none"
                  placeholder="Add a follow-up message…"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <button className="btn btn-primary self-end" onClick={sendReply} disabled={sending || !replyText.trim()}>
                  {sending ? <Spinner size={16} /> : <Send size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
