"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import {
  AdminTable, AdminTr, AdminTd, AdminModal,
  AdminInput, AdminLabel, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";

const LANGUAGES = [{ code: "en", label: "English" }, { code: "es", label: "Español" }, { code: "pt", label: "Português" }];
const BLANK = { question: "", answer: "", category: "General", language: "en", sort_order: "99", is_active: true };

export default function AdminFaqsPage() {
  const [faqs, setFaqs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [filterLang, setFilterLang] = useState("all");
  const [form, setForm] = useState({ ...BLANK });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/faqs").then(r => r.json()).then(d => setFaqs(d.faqs ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const categories = [...new Set(faqs.map(f => f.category))].sort();
  const filtered   = filterLang === "all" ? faqs : faqs.filter(f => f.language === filterLang);

  const openCreate = () => { setEditing(null); setForm({ ...BLANK }); setModal(true); };
  const openEdit   = (f: any) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category, language: f.language, sort_order: String(f.sort_order), is_active: f.is_active });
    setModal(true);
  };

  const save = async () => {
    if (!form.question || !form.answer || !form.category) return;
    setSaving(true);
    const body = { ...form, sort_order: parseInt(form.sort_order) || 99 };
    const [url, method] = editing ? [`/api/admin/faqs/${editing.id}`, "PATCH"] : ["/api/admin/faqs", "POST"];
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setModal(false); load(); }
    else { const d = await res.json(); alert(d.message); }
  };

  const del = async (id: string) => {
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    setConfirmDel(null); load();
  };

  const LANG_BADGE: Record<string, string> = { en: "bg-blue-100 text-blue-700", es: "bg-amber-100 text-amber-700", pt: "bg-green-100 text-green-700" };

  return (
    <div className="space-y-5 max-w-[960px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0d1117]">Help FAQs</h1>
          <p className="text-[13px] text-[#9399a8] mt-0.5">Manage FAQ content in English, Spanish, and Portuguese.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
            className="bg-white border border-[#e2e4e9] rounded-[8px] px-3 py-2 text-[13px] text-[#1a2030] outline-none">
            <option value="all">All languages</option>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <AdminBtn onClick={openCreate}><Plus size={13} /> New FAQ</AdminBtn>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[#f0f1f5] animate-pulse" />)}</div>
      ) : (
        <AdminTable headers={["Lang", "Category", "Question", "#", "Active", ""]}>
          {filtered.length === 0 && <AdminEmpty message="No FAQs yet. Create your first FAQ." />}
          {filtered.map(faq => (
            <AdminTr key={faq.id}>
              <AdminTd>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${LANG_BADGE[faq.language] ?? "bg-gray-100 text-gray-600"}`}>
                  {faq.language}
                </span>
              </AdminTd>
              <AdminTd className="text-[12px] text-[#374151]">{faq.category}</AdminTd>
              <AdminTd>
                <p className="text-[13px] font-medium text-[#0d1117] truncate max-w-[280px]">{faq.question}</p>
                <p className="text-[11px] text-[#9399a8] truncate max-w-[280px]">{faq.answer}</p>
              </AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">{faq.sort_order}</AdminTd>
              <AdminTd>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${faq.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {faq.is_active ? "Active" : "Hidden"}
                </span>
              </AdminTd>
              <AdminTd>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(faq)} className="p-1.5 rounded text-[#9399a8] hover:text-[#0d1117] hover:bg-[#f0f1f5]"><Pencil size={13} /></button>
                  <button onClick={() => setConfirmDel(faq)} className="p-1.5 rounded text-[#9399a8] hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? "Edit FAQ" : "New FAQ"}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <AdminLabel>Language</AdminLabel>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <AdminLabel>Category</AdminLabel>
              <AdminInput value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} list="faq-categories" placeholder="e.g. Quotes" />
              <datalist id="faq-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <AdminLabel>Sort order</AdminLabel>
              <AdminInput type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            </div>
          </div>
          <div>
            <AdminLabel>Question *</AdminLabel>
            <AdminInput value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. How do I send a quote for approval?" />
          </div>
          <div>
            <AdminLabel>Answer *</AdminLabel>
            <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={4} placeholder="Write the answer here…"
              className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] resize-none" />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
            Active (visible to users)
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <AdminBtn onClick={() => setModal(false)} variant="ghost">Cancel</AdminBtn>
            <AdminBtn onClick={save} disabled={saving || !form.question || !form.answer}>{saving ? "Saving…" : editing ? "Save Changes" : "Create FAQ"}</AdminBtn>
          </div>
        </div>
      </AdminModal>

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-[16px] font-bold text-[#0d1117] mb-2">Delete FAQ?</h3>
            <p className="text-[13px] text-[#6b7280] mb-4 line-clamp-2">{confirmDel.question}</p>
            <div className="flex gap-2 justify-end">
              <AdminBtn onClick={() => setConfirmDel(null)} variant="ghost">Cancel</AdminBtn>
              <AdminBtn onClick={() => del(confirmDel.id)} variant="red">Delete</AdminBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
