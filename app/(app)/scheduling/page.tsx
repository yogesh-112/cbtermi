"use client";
import { useEffect, useState } from "react";
import {
  Calendar, Plus, Link2, Users, Settings2, Pencil, Trash2,
  Copy, Check, ChevronRight, Clock, MapPin, ExternalLink,
  Mail, MessageSquare, Phone,
} from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, Spinner, toast, Tabs, FormField } from "@/components/ui";

const MEETING_TYPES = ["Consultation","Site Visit","Estimate Meeting","Project Discussion","Final Walkthrough","Follow-up Call","Other"];
const REPEAT_OPTIONS = [{ value:"none", label:"Does not repeat" },{ value:"daily", label:"Daily" },{ value:"weekly", label:"Weekly" },{ value:"monthly", label:"Monthly" }];
const SLOT_STATUSES = ["available","booked","expired","canceled"];
const MEETING_STATUSES = [{ value:"scheduled",label:"Scheduled",color:"bg-blue-100 text-blue-700" },{ value:"confirmed",label:"Confirmed",color:"bg-indigo-100 text-indigo-700" },{ value:"completed",label:"Completed",color:"bg-green-100 text-green-700" },{ value:"canceled",label:"Canceled",color:"bg-red-100 text-red-700" },{ value:"no_show",label:"No Show",color:"bg-gray-100 text-gray-600" },{ value:"rescheduled",label:"Rescheduled",color:"bg-amber-100 text-amber-700" }];
const SLOT_STATUS_COLORS: Record<string,string> = { available:"bg-green-100 text-green-700", booked:"bg-blue-100 text-blue-700", expired:"bg-gray-100 text-gray-500", canceled:"bg-red-100 text-red-600" };

export default function SchedulingPage() {
  const [tab, setTab] = useState<"slots"|"links"|"meetings"|"settings">("slots");
  const [slots, setSlots] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotModal, setSlotModal] = useState(false);
  const [editSlot, setEditSlot] = useState<any | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [viewLink, setViewLink] = useState<any | null>(null);
  const [viewMeeting, setViewMeeting] = useState<any | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [slotForm, setSlotForm] = useState({ slot_date: "", start_time: "", end_time: "", purpose: "", meeting_type: "Consultation", location: "", notes: "", time_zone: "America/New_York", repeat_option: "none", repeat_count: "1" });
  const [linkForm, setLinkForm] = useState({ title: "", purpose: "", contact_id: "", expiry_date: "", internal_notes: "", message_to_recipient: "", slot_ids: [] as string[] });

  const load = async () => {
    setLoading(true);
    const [s, l, m, c] = await Promise.all([
      fetch("/api/scheduling/slots").then(r => r.json()),
      fetch("/api/scheduling/booking-links").then(r => r.json()),
      fetch("/api/scheduling/meetings").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]);
    setSlots(s.slots ?? []);
    setLinks(l.links ?? []);
    setMeetings(m.meetings ?? []);
    setContacts(c.contacts ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreateSlot = () => { setEditSlot(null); setSlotForm({ slot_date: "", start_time: "", end_time: "", purpose: "", meeting_type: "Consultation", location: "", notes: "", time_zone: "America/New_York", repeat_option: "none", repeat_count: "1" }); setSlotModal(true); };
  const openEditSlot = (s: any) => { setEditSlot(s); setSlotForm({ slot_date: s.slot_date, start_time: s.start_time ?? "", end_time: s.end_time ?? "", purpose: s.purpose ?? "", meeting_type: s.meeting_type ?? "Consultation", location: s.location ?? "", notes: s.notes ?? "", time_zone: s.time_zone ?? "America/New_York", repeat_option: "none", repeat_count: "1" }); setSlotModal(true); };

  const saveSlot = async () => {
    if (!slotForm.slot_date) { toast("Date is required", "error"); return; }
    setSaving(true);
    const url = editSlot ? `/api/scheduling/slots/${editSlot.id}` : "/api/scheduling/slots";
    const method = editSlot ? "PATCH" : "POST";
    const body = editSlot ? { ...slotForm } : { ...slotForm };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { toast(editSlot ? "Slot updated" : "Slot(s) created", "success"); setSlotModal(false); load(); }
    else toast(d.message ?? "Failed to save slot", "error");
  };

  const deleteSlot = async () => {
    if (!deleteSlotId) return;
    const res = await fetch(`/api/scheduling/slots/${deleteSlotId}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { toast("Slot deleted", "success"); load(); }
    else toast(d.message ?? "Cannot delete", "error");
    setDeleteSlotId(null);
  };

  const saveLink = async () => {
    if (!linkForm.title.trim()) { toast("Title is required", "error"); return; }
    if (!linkForm.slot_ids.length) { toast("Select at least one slot", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/scheduling/booking-links", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...linkForm, contact_id: linkForm.contact_id || null, expiry_date: linkForm.expiry_date || null }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { toast("Booking link created!", "success"); setLinkModal(false); setViewLink(d.link); load(); }
    else toast(d.message ?? "Failed to create link", "error");
  };

  const cancelLink = async (id: string) => {
    await fetch(`/api/scheduling/booking-links/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "canceled" }) });
    toast("Link canceled", "success"); load();
  };

  const updateMeeting = async (id: string, status: string) => {
    const res = await fetch(`/api/scheduling/meetings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { toast("Meeting updated", "success"); load(); setViewMeeting(null); }
    else toast("Failed to update", "error");
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/booking/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast("Link copied!", "success");
  };

  const meetingStatusInfo = (s: string) => MEETING_STATUSES.find(m => m.value === s) ?? { label: s, color: "bg-gray-100 text-gray-600" };

  const availableSlots = slots.filter(s => s.status === "available");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scheduling</h1>
          <p className="page-desc">Create time slots, generate booking links, and manage meetings.</p>
        </div>
        {tab === "slots" && (
          <button className="btn btn-primary" onClick={openCreateSlot}><Plus size={15} /> New Slot</button>
        )}
        {tab === "links" && (
          <button className="btn btn-primary" onClick={() => { setLinkForm({ title: "", purpose: "", contact_id: "", expiry_date: "", internal_notes: "", message_to_recipient: "", slot_ids: [] }); setLinkModal(true); }}>
            <Plus size={15} /> Create Link
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Available Slots", value: slots.filter(s=>s.status==="available").length, color: "mini-stat-green" },
          { label: "Active Links", value: links.filter(l=>l.status==="active").length, color: "mini-stat-navy" },
          { label: "Scheduled Meetings", value: meetings.filter(m=>m.status==="scheduled").length, color: "mini-stat" },
          { label: "Completed", value: meetings.filter(m=>m.status==="completed").length, color: "mini-stat-green" },
        ].map(s => (
          <div key={s.label} className={`mini-stat ${s.color}`}>
            <span className="stat-value text-[22px]">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <Tabs tabs={[
        { id: "slots", label: `Availability (${availableSlots.length})` },
        { id: "links", label: `Booking Links (${links.length})` },
        { id: "meetings", label: `Meetings (${meetings.length})` },
        { id: "settings", label: "Settings" },
      ]} active={tab} onChange={id => setTab(id as any)} />

      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : (
        <>
          {/* Slots Tab */}
          {tab === "slots" && (
            <div className="mt-5">
              {slots.length === 0 ? (
                <EmptyState icon={Calendar} title="No slots yet" description="Create your first availability slot." action={{ label: "New Slot", onClick: openCreateSlot }} />
              ) : (
                <div className="space-y-3">
                  {slots.map(slot => (
                    <div key={slot.id} className="card p-4 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#f0f5ff] flex items-center justify-center flex-shrink-0">
                          <Calendar size={17} className="text-[#123B5D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13px] text-[#1f2937]">{slot.slot_date}
                            {slot.start_time && <span className="text-[#6b7280] font-normal ml-2">· {slot.start_time}{slot.end_time ? ` – ${slot.end_time}` : ""}</span>}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[12px] text-[#6b7280]">{slot.meeting_type}</span>
                            {slot.purpose && <span className="text-[12px] text-[#6b7280]">· {slot.purpose}</span>}
                            {slot.location && <span className="text-[12px] text-[#6b7280] flex items-center gap-1"><MapPin size={11} />{slot.location}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${SLOT_STATUS_COLORS[slot.status] ?? "bg-gray-100 text-gray-500"}`}>{slot.status}</span>
                        {slot.status === "available" && (
                          <>
                            <button className="btn btn-ghost btn-sm" aria-label="Edit slot" onClick={() => openEditSlot(slot)}><Pencil size={13} /></button>
                            <button className="btn btn-ghost btn-sm text-red-500" aria-label="Delete slot" onClick={() => setDeleteSlotId(slot.id)}><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Links Tab */}
          {tab === "links" && (
            <div className="mt-5">
              {links.length === 0 ? (
                <EmptyState icon={Link2} title="No booking links" description="Create a booking link to share with contacts." action={{ label: "Create Link", onClick: () => setLinkModal(true) }} />
              ) : (
                <div className="space-y-3">
                  {links.map(link => {
                    const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${link.token}`;
                    return (
                      <div key={link.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[14px] text-[#1f2937]">{link.title}</p>
                            {link.purpose && <p className="text-[12px] text-[#6b7280] mt-0.5">{link.purpose}</p>}
                            {link.contacts && <p className="text-[12px] text-[#6b7280] mt-0.5 flex items-center gap-1"><Users size={11} />{link.contacts.full_name}</p>}
                            <p className="text-[11px] text-[#9ca3af] mt-1">
                              {(link.booking_link_slots ?? []).length} slot(s) · Created {new Date(link.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${link.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{link.status}</span>
                        </div>
                        {link.status === "active" && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-[#f3f4f6]">
                            <button onClick={() => copyLink(link.token)} className="btn btn-outline btn-sm">
                              {copiedToken === link.token ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                            </button>
                            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                              <ExternalLink size={12} /> Preview
                            </a>
                            <a href={`mailto:?subject=Book a meeting&body=${encodeURIComponent(bookingUrl)}`} className="btn btn-ghost btn-sm">
                              <Mail size={12} /> Email
                            </a>
                            <a href={`https://wa.me/?text=${encodeURIComponent(bookingUrl)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                              <MessageSquare size={12} /> WhatsApp
                            </a>
                            <button onClick={() => cancelLink(link.id)} className="btn btn-ghost btn-sm text-red-500 ml-auto">Cancel</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Meetings Tab */}
          {tab === "meetings" && (
            <div className="mt-5">
              {meetings.length === 0 ? (
                <EmptyState icon={Users} title="No meetings yet" description="Meetings will appear here once customers book a slot." />
              ) : (
                <div className="space-y-3">
                  {meetings.map(m => {
                    const si = meetingStatusInfo(m.status);
                    return (
                      <div key={m.id} className="card p-4 cursor-pointer hover:shadow-card-md transition-shadow" onClick={() => setViewMeeting(m)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[14px] text-[#1f2937]">
                              {m.guest_name ?? m.contacts?.full_name ?? "Unknown"}
                            </p>
                            <p className="text-[12px] text-[#6b7280] mt-0.5">
                              {m.scheduling_slots?.slot_date ?? "—"}
                              {m.scheduling_slots?.start_time && ` · ${m.scheduling_slots.start_time}`}
                              {m.purpose && ` · ${m.purpose}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {m.guest_email && <span className="text-[11px] text-[#9ca3af] flex items-center gap-1"><Mail size={10} />{m.guest_email}</span>}
                              {m.guest_phone && <span className="text-[11px] text-[#9ca3af] flex items-center gap-1"><Phone size={10} />{m.guest_phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${si.color}`}>{si.label}</span>
                            <ChevronRight size={15} className="text-[#9ca3af]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="mt-5">
              <div className="card p-6 max-w-lg">
                <h3 className="font-semibold text-[15px] text-[#1f2937] mb-1">Calendar Settings</h3>
                <p className="text-[13px] text-[#6b7280] mb-4">Advanced calendar integrations and preferences coming soon.</p>
                <div className="space-y-3">
                  {[
                    "Google Calendar sync",
                    "Outlook Calendar sync",
                    "ICS calendar invite in emails",
                    "Buffer time between meetings",
                    "Working hours configuration",
                  ].map(item => (
                    <div key={item} className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-0">
                      <span className="text-[13px] text-[#374151]">{item}</span>
                      <span className="text-[11px] text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-full">Coming soon</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Slot Modal */}
      <Modal open={slotModal} onClose={() => setSlotModal(false)} title={editSlot ? "Edit Slot" : "New Availability Slot"} size="md">
        <div className="space-y-4">
          <FormField label="Date *">
            <input type="date" className="field" value={slotForm.slot_date} onChange={e => setSlotForm(p=>({...p, slot_date:e.target.value}))} />
          </FormField>
          <div className="form-row">
            <FormField label="Start Time (optional)">
              <input type="time" className="field" value={slotForm.start_time} onChange={e => setSlotForm(p=>({...p, start_time:e.target.value}))} />
            </FormField>
            <FormField label="End Time (optional)">
              <input type="time" className="field" value={slotForm.end_time} onChange={e => setSlotForm(p=>({...p, end_time:e.target.value}))} />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Meeting Type">
              <select className="field" value={slotForm.meeting_type} onChange={e => setSlotForm(p=>({...p, meeting_type:e.target.value}))}>
                {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Purpose">
              <input className="field" placeholder="e.g. Kitchen estimate" value={slotForm.purpose} onChange={e => setSlotForm(p=>({...p, purpose:e.target.value}))} />
            </FormField>
          </div>
          <FormField label="Location / Meeting Method">
            <input className="field" placeholder="e.g. On-site, Zoom, Phone call" value={slotForm.location} onChange={e => setSlotForm(p=>({...p, location:e.target.value}))} />
          </FormField>
          {!editSlot && (
            <div className="form-row">
              <FormField label="Repeat">
                <select className="field" value={slotForm.repeat_option} onChange={e => setSlotForm(p=>({...p, repeat_option:e.target.value}))}>
                  {REPEAT_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FormField>
              {slotForm.repeat_option !== "none" && (
                <FormField label="Number of times">
                  <input type="number" min="2" max="52" className="field" value={slotForm.repeat_count} onChange={e => setSlotForm(p=>({...p, repeat_count:e.target.value}))} />
                </FormField>
              )}
            </div>
          )}
          <FormField label="Notes">
            <textarea className="field" rows={2} value={slotForm.notes} onChange={e => setSlotForm(p=>({...p, notes:e.target.value}))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-outline" onClick={() => setSlotModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveSlot} disabled={saving}>
              {saving ? <><Spinner size={16} /> Saving…</> : editSlot ? "Update Slot" : "Create Slot"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Link Modal */}
      <Modal open={linkModal} onClose={() => setLinkModal(false)} title="Create Booking Link" size="md">
        <div className="space-y-4">
          <FormField label="Link Title *">
            <input className="field" placeholder="e.g. Kitchen Estimate Booking" value={linkForm.title} onChange={e => setLinkForm(p=>({...p, title:e.target.value}))} />
          </FormField>
          <FormField label="Purpose">
            <input className="field" placeholder="e.g. Site visit for estimate" value={linkForm.purpose} onChange={e => setLinkForm(p=>({...p, purpose:e.target.value}))} />
          </FormField>
          <FormField label="Pre-select Contact (optional)">
            <select className="field" value={linkForm.contact_id} onChange={e => setLinkForm(p=>({...p, contact_id:e.target.value}))}>
              <option value="">— No contact —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.email ? ` (${c.email})` : ""}</option>)}
            </select>
          </FormField>
          <FormField label="Select Available Slots *" hint="Customer will choose from these slots.">
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto border border-[#e5e7eb] rounded-xl p-2">
              {availableSlots.length === 0 && (
                <p className="text-[13px] text-[#6b7280] text-center py-4">No available slots. Create slots first.</p>
              )}
              {availableSlots.map(s => (
                <label key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#f9fafb] cursor-pointer">
                  <input type="checkbox" checked={linkForm.slot_ids.includes(s.id)}
                    onChange={e => setLinkForm(p => ({ ...p, slot_ids: e.target.checked ? [...p.slot_ids, s.id] : p.slot_ids.filter(id => id !== s.id) }))} />
                  <span className="text-[13px] text-[#374151]">
                    {s.slot_date}{s.start_time ? ` · ${s.start_time}` : ""} — {s.meeting_type}
                  </span>
                </label>
              ))}
            </div>
          </FormField>
          <div className="form-row">
            <FormField label="Expiry Date (optional)">
              <input type="date" className="field" value={linkForm.expiry_date} onChange={e => setLinkForm(p=>({...p, expiry_date:e.target.value}))} />
            </FormField>
          </div>
          <FormField label="Message to Recipient (optional)">
            <textarea className="field" rows={2} placeholder="A personal note shown on the booking page…" value={linkForm.message_to_recipient} onChange={e => setLinkForm(p=>({...p, message_to_recipient:e.target.value}))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-outline" onClick={() => setLinkModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveLink} disabled={saving}>
              {saving ? <><Spinner size={16} /> Creating…</> : <><Link2 size={14} /> Create Link</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Meeting Modal */}
      <Modal open={!!viewMeeting} onClose={() => setViewMeeting(null)} title="Meeting Details" size="md">
        {viewMeeting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:"Name", value: viewMeeting.guest_name ?? viewMeeting.contacts?.full_name },
                { label:"Email", value: viewMeeting.guest_email },
                { label:"Phone", value: viewMeeting.guest_phone ?? "—" },
                { label:"Date", value: viewMeeting.scheduling_slots?.slot_date },
                { label:"Time", value: viewMeeting.scheduling_slots?.start_time ?? "Flexible" },
                { label:"Purpose", value: viewMeeting.purpose ?? "—" },
                { label:"Booking Source", value: viewMeeting.booking_links?.title ?? "—" },
                { label:"Status", value: meetingStatusInfo(viewMeeting.status).label },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-[11px] text-[#6b7280] uppercase tracking-wide">{row.label}</p>
                  <p className="text-[14px] text-[#1f2937] font-medium mt-0.5">{row.value ?? "—"}</p>
                </div>
              ))}
            </div>
            {viewMeeting.notes && (
              <div>
                <p className="label">Notes</p>
                <p className="text-[14px] text-[#374151] bg-[#f9fafb] rounded-xl p-3 whitespace-pre-wrap">{viewMeeting.notes}</p>
              </div>
            )}
            {!["completed","canceled"].includes(viewMeeting.status) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#f3f4f6]">
                <button className="btn btn-green btn-sm" onClick={() => updateMeeting(viewMeeting.id, "completed")}>Mark Completed</button>
                <button className="btn btn-danger btn-sm" onClick={() => updateMeeting(viewMeeting.id, "canceled")}>Cancel Meeting</button>
                <button className="btn btn-outline btn-sm" onClick={() => updateMeeting(viewMeeting.id, "confirmed")}>Confirm</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteSlotId} onClose={() => setDeleteSlotId(null)} onConfirm={deleteSlot} title="Delete Slot" message="Delete this slot? Any booking links including this slot will be affected." danger />
      <ConfirmDialog open={!!deleteLinkId} onClose={() => setDeleteLinkId(null)} onConfirm={async () => { await fetch(`/api/scheduling/booking-links/${deleteLinkId}`, { method: "DELETE" }); load(); setDeleteLinkId(null); }} title="Delete Link" message="Delete this booking link permanently?" danger />
    </div>
  );
}
