"use client";
import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronRight, Trash2, ClipboardList } from "lucide-react";
import { Modal, toast, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function ItemRequirementsPage() {
  const t = useT();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", project_id: "", contact_id: "", notes: "" });
  const [items, setItems] = useState([{ item_name: "", quantity: 1, notes: "" }]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/item-requirements").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]).then(([lr, pr, cr]) => {
      setLists(lr.lists ?? []);
      setProjects(pr.projects ?? []);
      setContacts(cr.contacts ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string) => setExpanded(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  const addItem = () => setItems(i => [...i, { item_name: "", quantity: 1, notes: "" }]);
  const setItem = (idx: number, k: string, v: any) => setItems(i => i.map((x, i2) => i2 === idx ? { ...x, [k]: v } : x));
  const removeItem = (idx: number) => setItems(i => i.filter((_, i2) => i2 !== idx));

  const save = async () => {
    if (!form.title) { toast("Title required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/item-requirements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: items.filter(i => i.item_name.trim()) }),
    });
    setSaving(false);
    if (res.ok) {
      toast("List created"); setModal(false);
      setForm({ title: "", project_id: "", contact_id: "", notes: "" });
      setItems([{ item_name: "", quantity: 1, notes: "" }]); load();
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Requirements</h1>
          <p className="page-desc">Material and item lists for projects</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}><Plus size={15} /> New List</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse skeleton" />)}
        </div>
      ) : lists.length === 0 ? (
        <EmptyState icon={<ClipboardList size={36} />} title="No item requirement lists yet"
          description="Create lists to track materials and items needed for projects."
          action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> New List</button>} />
      ) : (
        <div className="space-y-3">
          {lists.map((list: any) => (
            <div key={list.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f6f6f3] transition-colors"
                onClick={() => toggle(list.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {expanded.includes(list.id)
                      ? <ChevronDown size={15} className="text-brand-navy" />
                      : <ChevronRight size={15} className="text-brand-navy" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0c1226]">{list.title}</p>
                    <p className="text-xs text-[#8a8fa3] mt-0.5 flex items-center gap-3">
                      {list.projects?.name && <span>Project: {list.projects.name}</span>}
                      {list.contacts?.full_name && <span>Contact: {list.contacts.full_name}</span>}
                      <span>{fmtDate(list.created_at)}</span>
                      <span className="font-medium text-[#4a5168]">
                        {(list.item_requirements ?? []).length} item{(list.item_requirements ?? []).length !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                </div>
              </button>

              {expanded.includes(list.id) && (
                <div className="border-t border-[#f0efea] px-5 pb-4">
                  {list.notes && <p className="text-sm text-[#4a5168] mt-3 mb-3 bg-[#f6f6f3] rounded-xl px-3 py-2">{list.notes}</p>}
                  <div className="mt-3 space-y-2">
                    {(list.item_requirements ?? []).length === 0 ? (
                      <p className="text-sm text-[#8a8fa3] text-center py-4">No items in this list</p>
                    ) : (list.item_requirements ?? []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#f6f6f3] rounded-xl">
                        <div className="w-6 h-6 bg-brand-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-navy text-[10px] font-bold">{item.quantity}</span>
                        </div>
                        <span className="font-medium text-[#4a5168] flex-1">{item.item_name}</span>
                        {item.notes && <span className="text-xs text-[#8a8fa3]">{item.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Item Requirement List" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">List title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="field" placeholder="e.g. Kitchen Renovation Materials" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Project (optional)</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
                <option value="">— None —</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contact (optional)</label>
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="field">
                <option value="">— None —</option>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="field" placeholder="Optional notes about this list" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Items</label>
              <button type="button" onClick={addItem} className="btn btn-outline btn-sm"><Plus size={13} /> Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.item_name} onChange={e => setItem(idx, "item_name", e.target.value)}
                    className="field col-span-5" placeholder="Item name" />
                  <input type="number" value={item.quantity} onChange={e => setItem(idx, "quantity", e.target.value)}
                    className="field col-span-2" placeholder="Qty" min={1} />
                  <input value={item.notes} onChange={e => setItem(idx, "notes", e.target.value)}
                    className="field col-span-4" placeholder="Notes" />
                  <button type="button" onClick={() => removeItem(idx)}
                    className="btn btn-ghost btn-sm text-red-500 col-span-1 p-2"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create List"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
