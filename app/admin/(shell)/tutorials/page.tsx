"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  AdminTable, AdminTr, AdminTd, AdminModal,
  AdminInput, AdminLabel, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";

const TOPICS = ["Onboarding", "Quotes", "Projects", "Billing", "Scheduling", "Expenses", "Leads", "Settings", "Other"];

const BLANK = { title: "", topic: "Onboarding", duration: "", youtube_id: "", sort_order: "99", is_active: true };

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [saving, setSaving]       = useState(false);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [form, setForm] = useState({ ...BLANK });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/tutorials").then(r => r.json()).then(d => setTutorials(d.tutorials ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...BLANK }); setModal(true); };
  const openEdit   = (t: any) => {
    setEditing(t);
    setForm({ title: t.title, topic: t.topic, duration: t.duration ?? "", youtube_id: t.youtube_id ?? "", sort_order: String(t.sort_order), is_active: t.is_active });
    setModal(true);
  };

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    const body = { ...form, sort_order: parseInt(form.sort_order) || 99 };
    const [url, method] = editing
      ? [`/api/admin/tutorials/${editing.id}`, "PATCH"]
      : ["/api/admin/tutorials", "POST"];
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setModal(false); load(); }
    else { const d = await res.json(); alert(d.message); }
  };

  const toggleActive = async (t: any) => {
    await fetch(`/api/admin/tutorials/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    load();
  };

  const del = async (id: string) => {
    await fetch(`/api/admin/tutorials/${id}`, { method: "DELETE" });
    setConfirmDel(null);
    load();
  };

  const youtubeThumb = (id: string) => id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;

  return (
    <div className="space-y-5 max-w-[960px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0d1117]">Tutorial Videos</h1>
          <p className="text-[13px] text-[#9399a8] mt-0.5">
            Manage the videos shown in the Help page Tutorials tab. Enter real YouTube video IDs to activate each tutorial.
          </p>
        </div>
        <AdminBtn onClick={openCreate}><Plus size={13} /> New Tutorial</AdminBtn>
      </div>

      {/* Quick guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 text-[13px] text-amber-800">
        <strong>How to get a YouTube ID:</strong> From any YouTube URL like{" "}
        <code className="bg-amber-100 px-1 rounded">https://youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong></code>{" "}
        — copy the bold part after <code className="bg-amber-100 px-1 rounded">v=</code> and paste it in the YouTube ID field.
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#f0f1f5] animate-pulse" />)}</div>
      ) : (
        <AdminTable headers={["#", "Thumbnail", "Title", "Topic", "Duration", "Status", ""]}>
          {tutorials.length === 0 && <AdminEmpty message="No tutorials yet." />}
          {tutorials.map(tut => (
            <AdminTr key={tut.id}>
              <AdminTd className="text-[12px] text-[#9399a8] w-8">{tut.sort_order}</AdminTd>
              <AdminTd className="w-24">
                {tut.youtube_id ? (
                  <img src={youtubeThumb(tut.youtube_id)!} alt={tut.title}
                    className="w-20 h-12 object-cover rounded-lg bg-[#f0f1f5]" />
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-[#f0f1f5] flex items-center justify-center text-[10px] text-[#9399a8] text-center px-1">
                    No video yet
                  </div>
                )}
              </AdminTd>
              <AdminTd>
                <p className="text-[13px] font-medium text-[#0d1117]">{tut.title}</p>
                {tut.youtube_id ? (
                  <a href={`https://youtube.com/watch?v=${tut.youtube_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-[#b33a4b] hover:underline flex items-center gap-0.5 mt-0.5">
                    <ExternalLink size={10} /> {tut.youtube_id}
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-600 font-medium">⚠ No YouTube ID set</span>
                )}
              </AdminTd>
              <AdminTd><span className="text-[12px] text-[#374151] bg-[#f0f1f5] px-2 py-0.5 rounded-full">{tut.topic}</span></AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">{tut.duration || "—"}</AdminTd>
              <AdminTd>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tut.is_active && tut.youtube_id ? "bg-green-100 text-green-700" : tut.youtube_id ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
                  {!tut.youtube_id ? "Needs ID" : tut.is_active ? "Visible" : "Hidden"}
                </span>
              </AdminTd>
              <AdminTd>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(tut)} className="p-1.5 rounded text-[#9399a8] hover:text-[#0d1117] hover:bg-[#f0f1f5]" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => toggleActive(tut)} className="p-1.5 rounded text-[#9399a8] hover:text-[#0d1117] hover:bg-[#f0f1f5]" title={tut.is_active ? "Hide" : "Show"}>
                    {tut.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => setConfirmDel(tut)} className="p-1.5 rounded text-[#9399a8] hover:text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}

      {/* Create / Edit Modal */}
      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Tutorial" : "New Tutorial"}>
        <div className="space-y-4">
          <div>
            <AdminLabel>Title *</AdminLabel>
            <AdminInput value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Creating and Sending Quotes" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <AdminLabel>Topic *</AdminLabel>
              <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]">
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <AdminLabel>Duration</AdminLabel>
              <AdminInput value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 5:20" />
            </div>
          </div>
          <div>
            <AdminLabel>YouTube Video ID *</AdminLabel>
            <AdminInput value={form.youtube_id} onChange={e => setForm(f => ({ ...f, youtube_id: e.target.value.trim() }))} placeholder="e.g. dQw4w9WgXcQ (from youtube.com/watch?v=...)" />
            {form.youtube_id && (
              <div className="mt-2">
                <img src={`https://img.youtube.com/vi/${form.youtube_id}/mqdefault.jpg`} alt="Preview"
                  className="w-40 h-24 object-cover rounded-lg" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <AdminLabel>Sort order</AdminLabel>
              <AdminInput type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                Visible in Help page
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <AdminBtn onClick={() => setModal(false)} variant="ghost">Cancel</AdminBtn>
            <AdminBtn onClick={save} disabled={saving || !form.title}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Tutorial"}</AdminBtn>
          </div>
        </div>
      </AdminModal>

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-[16px] font-bold text-[#0d1117] mb-2">Delete tutorial?</h3>
            <p className="text-[13px] text-[#6b7280] mb-4">Delete <strong>{confirmDel.title}</strong>? This cannot be undone.</p>
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
