"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, UserPlus, ChevronDown, CalendarDays, FileText } from "lucide-react";
import { toast } from "@/components/ui";
import { Suspense } from "react";

const PROJECT_TYPES = [
  "Kitchen Remodel", "Bathroom Remodel", "Residential Remodel",
  "Commercial Build", "New Construction", "Roofing", "Flooring",
  "Painting", "Electrical", "Plumbing", "Landscaping", "Other",
];

const MILESTONE_OPTIONS = ["None", "1 Invoice", "2 Invoices", "3 Invoices", "4 Invoices", "Custom"];

function calcWorkingDays(start: string, end: string) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const totalDays = Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000));
  let working = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) working++;
    cur.setDate(cur.getDate() + 1);
  }
  return { total: totalDays, working };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${checked ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}>
      <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-[3px]"}`} />
    </button>
  );
}

function NewProjectForm() {
  const router = useRouter();
  const params = useSearchParams();
  const fromQuote = params.get("from_quote");

  const [contacts, setContacts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    contact_id: "",
    contact_name: "",
    project_type: "",
    project_manager: "",
    address: "",
    start_date: "",
    end_date: "",
    budget: "",
    deposit_pct: "30",
    milestones: "None",
    description: "",
    status: "active",
    share_with_customer: true,
  });

  const [assignedTeam, setAssignedTeam] = useState<Array<{ id: string; name: string; role: string }>>([]);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
    fetch("/api/team").then(r => r.json()).then(d => {
      const members = (d.members ?? []).map((m: any) => ({
        id: m.user_id,
        name: m.users?.full_name ?? m.users?.email ?? "Team member",
        role: m.role,
      }));
      setTeamMembers(members);
    });
  }, []);

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const duration = calcWorkingDays(form.start_date, form.end_date);

  const filteredContacts = contactSearch
    ? contacts.filter(c => c.full_name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.email?.toLowerCase().includes(contactSearch.toLowerCase()))
    : contacts;

  const selectContact = (c: any) => {
    set("contact_id", c.id);
    set("contact_name", c.full_name);
    setContactSearch("");
    setContactOpen(false);
  };

  const clearContact = () => {
    set("contact_id", "");
    set("contact_name", "");
  };

  const assignMember = (m: { id: string; name: string; role: string }) => {
    if (!assignedTeam.find(t => t.id === m.id)) {
      setAssignedTeam(prev => [...prev, m]);
    }
    setTeamOpen(false);
  };

  const removeMember = (id: string) => setAssignedTeam(prev => prev.filter(t => t.id !== id));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const save = async (status = "active") => {
    if (!form.name.trim()) { toast("Project name required", "error"); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      contact_id: form.contact_id || undefined,
      project_type: form.project_type || undefined,
      address: form.address || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      description: form.description || undefined,
      status,
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      toast("Project created");
      router.push(`/projects/${d.project.id}`);
    } else {
      toast("Failed to create project", "error");
    }
  };

  return (
    <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="page-title">New project</h1>
            <p className="page-desc">Start fresh, or convert from an approved quote.</p>
          </div>
        </div>
        {fromQuote ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef2ff] text-brand-navy text-[12px] font-medium rounded-lg border border-[#c7d5ff]">
            <FileText size={12} /> From quote {fromQuote}
          </div>
        ) : (
          <Link href="/quotes" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f6f3] text-[#4a5168] text-[12px] font-medium rounded-lg border border-[#e7e6e1] hover:bg-[#f0efea] transition-colors">
            <FileText size={12} /> From quote
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Main form */}
        <div className="space-y-5">

          {/* Basics */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Basics</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Project name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Hartwell Kitchen Remodel" className="field" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer */}
                <div className="relative">
                  <label className="label">Customer</label>
                  {form.contact_id ? (
                    <div className="flex items-center gap-2 h-[38px] px-3 border border-[#e7e6e1] rounded-lg bg-[#eef2ff] text-[13px] text-brand-navy font-medium">
                      <span className="flex-1 truncate">{form.contact_name}</span>
                      <button type="button" onClick={clearContact} className="text-brand-navy/50 hover:text-brand-navy">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        value={contactSearch}
                        onChange={e => { setContactSearch(e.target.value); setContactOpen(true); }}
                        onFocus={() => setContactOpen(true)}
                        placeholder="Search or add…"
                        className="field pr-8"
                      />
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none" />
                      {contactOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setContactOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 max-h-48 overflow-y-auto">
                            {filteredContacts.length === 0 ? (
                              <div className="px-3 py-2 text-[12px] text-[#8a8fa3]">No contacts found</div>
                            ) : filteredContacts.slice(0, 8).map(c => (
                              <button key={c.id} type="button" onClick={() => selectContact(c)}
                                className="w-full text-left px-3 py-2 text-[13px] text-[#0c1226] hover:bg-[#f6f6f3] transition-colors">
                                {c.full_name}
                                {c.email && <span className="text-[11px] text-[#8a8fa3] ml-2">{c.email}</span>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Project type */}
                <div>
                  <label className="label">Project type</label>
                  <select value={form.project_type} onChange={e => set("project_type", e.target.value)} className="field">
                    <option value="">Select type…</option>
                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Project manager */}
                <div>
                  <label className="label">Project manager</label>
                  <input value={form.project_manager} onChange={e => set("project_manager", e.target.value)}
                    placeholder="Your name" className="field" />
                </div>
              </div>

              <div>
                <label className="label">Job site address</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="1418 Westover Ln, Asheville, NC 28804" className="field" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Schedule</h2>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="label">Start date</label>
                <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="field" />
              </div>
              <div>
                <label className="label">End date</label>
                <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="field" />
              </div>
            </div>
            {duration && (
              <div className="flex items-center gap-2 text-[12px] text-[#4a5168] bg-[#f6f6f3] rounded-lg px-3 py-2">
                <CalendarDays size={13} className="text-brand-navy flex-shrink-0" />
                <span>
                  <span className="font-semibold">{duration.total} day duration</span>
                  {" · "}
                  <span>{duration.working} working days (excludes weekends)</span>
                </span>
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Budget</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Total budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] text-[13px]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.budget}
                    onChange={e => set("budget", e.target.value)}
                    placeholder="9,200.00"
                    className="field pl-6"
                  />
                </div>
              </div>
              <div>
                <label className="label">Deposit (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.deposit_pct}
                  onChange={e => set("deposit_pct", e.target.value)}
                  placeholder="30"
                  className="field"
                />
              </div>
              <div>
                <label className="label">Milestones</label>
                <select value={form.milestones} onChange={e => set("milestones", e.target.value)} className="field">
                  {MILESTONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {form.budget && form.deposit_pct && (
              <div className="mt-3 flex items-center gap-4 text-[12px] text-[#4a5168]">
                <span>Deposit amount: <span className="font-semibold text-[#0c1226]">${(parseFloat(form.budget) * parseFloat(form.deposit_pct) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                <span>Remaining: <span className="font-semibold text-[#0c1226]">${(parseFloat(form.budget) * (1 - parseFloat(form.deposit_pct) / 100)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Description</h2>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the project scope…"
              className="field resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link href="/projects" className="btn btn-outline">Cancel</Link>
            <button onClick={() => save("active")} disabled={saving}
              className="btn btn-ghost border border-[#e7e6e1] text-[#4a5168]">
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button onClick={() => save("active")} disabled={saving}
              className="btn btn-primary px-6">
              {saving ? "Creating…" : "Create project"}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Cover photo */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Cover photo</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            {coverPreview ? (
              <div className="relative rounded-lg overflow-hidden aspect-video mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setCoverPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div className="h-[100px] border-2 border-dashed border-[#e7e6e1] rounded-lg flex flex-col items-center justify-center gap-1.5 text-[#8a8fa3] mb-2">
                <Upload size={18} className="opacity-50" />
                <span className="text-[11px]">No cover yet</span>
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="btn btn-outline btn-sm w-full text-[12px] gap-1.5">
              <Upload size={12} /> Choose file
            </button>
          </div>

          {/* Team */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Team</p>
            <div className="space-y-2 mb-3">
              {assignedTeam.map(m => {
                const initials = m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[9px] font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0c1226] truncate">{m.name}</p>
                      <p className="text-[10px] text-[#8a8fa3] capitalize">{m.role}</p>
                    </div>
                    <button type="button" onClick={() => removeMember(m.id)}
                      className="w-5 h-5 flex items-center justify-center text-[#8a8fa3] hover:text-red-500 transition-colors rounded">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {assignedTeam.length === 0 && (
                <p className="text-[11px] text-[#8a8fa3]">No team members assigned yet.</p>
              )}
            </div>

            <div className="relative">
              <button type="button" onClick={() => setTeamOpen(!teamOpen)}
                className="flex items-center gap-1.5 text-[12px] text-brand-green font-medium hover:text-brand-green/80 transition-colors">
                <UserPlus size={13} /> Assign team member
              </button>
              {teamOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTeamOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 w-52 overflow-hidden">
                    {teamMembers.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-[#8a8fa3]">No team members yet</div>
                    ) : teamMembers.map(m => (
                      <button key={m.id} type="button" onClick={() => assignMember(m)}
                        className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f6f6f3] transition-colors ${assignedTeam.find(t => t.id === m.id) ? "opacity-40 pointer-events-none" : ""}`}>
                        {m.name}
                        <span className="text-[10px] text-[#8a8fa3] ml-2 capitalize">{m.role}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Visibility</p>
            <p className="text-[11px] text-[#8a8fa3] mb-3 leading-relaxed">
              Customer sees real-time updates, photos, and invoices on their portal.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#0c1226]">Share with customer</span>
              <Toggle checked={form.share_with_customer} onChange={() => set("share_with_customer", !form.share_with_customer)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  return <Suspense><NewProjectForm /></Suspense>;
}
