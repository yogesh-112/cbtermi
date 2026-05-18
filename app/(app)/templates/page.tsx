"use client";
import { useEffect, useState } from "react";
import { Plus, Copy, Pencil, Trash2, Eye, Lock, FileText, Bell, MessagesSquare, Receipt } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, Spinner, toast, Tabs, FormField } from "@/components/ui";

const TYPES = [
  { id: "notification", label: "Notifications", icon: Bell },
  { id: "communication", label: "Communications", icon: MessagesSquare },
  { id: "quote", label: "Quotes", icon: FileText },
  { id: "invoice", label: "Invoices", icon: Receipt },
];

const VARIABLES = ["{{contact_name}}","{{customer_name}}","{{business_name}}","{{project_name}}","{{quote_number}}","{{invoice_number}}","{{amount_due}}","{{due_date}}","{{booking_link}}","{{feedback_link}}"];

export default function TemplatesPage() {
  const [activeType, setActiveType] = useState("notification");
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTpl, setEditTpl] = useState<any | null>(null);
  const [previewTpl, setPreviewTpl] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", variables: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/templates?type=${activeType}`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeType]);

  const openCreate = () => {
    setEditTpl(null);
    setForm({ name: "", subject: "", body: "", variables: [] });
    setModal(true);
  };

  const openEdit = (tpl: any) => {
    setEditTpl(tpl);
    setForm({ name: tpl.name, subject: tpl.subject ?? "", body: tpl.body, variables: tpl.variables ?? [] });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.body.trim()) { toast("Name and body are required", "error"); return; }
    setSaving(true);
    const url = editTpl ? `/api/templates/${editTpl.id}` : "/api/templates";
    const method = editTpl ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: activeType }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      toast(editTpl ? "Template updated" : "Template created", "success");
      setModal(false);
      load();
    } else {
      toast(d.message ?? "Failed to save", "error");
    }
  };

  const duplicate = async (id: string) => {
    setDuplicating(id);
    const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
    const d = await res.json();
    setDuplicating(null);
    if (res.ok) { toast("Template duplicated", "success"); load(); }
    else toast(d.message ?? "Failed to duplicate", "error");
  };

  const deleteTemplate = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/templates/${deleteId}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { toast("Template deleted", "success"); load(); }
    else toast(d.message ?? "Cannot delete", "error");
    setDeleteId(null);
  };

  const insertVar = (v: string) => {
    setForm(p => ({ ...p, body: p.body + v }));
  };

  const systemTpls = templates.filter(t => t.is_system);
  const customTpls = templates.filter(t => !t.is_system);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-desc">Reusable templates for notifications, communications, quotes, and invoices.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> New Template
        </button>
      </div>

      <Tabs tabs={TYPES.map(t => ({ id: t.id, label: t.label }))} active={activeType} onChange={id => setActiveType(id)} />

      <div className="mt-5 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            {systemTpls.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lock size={11} /> System Templates
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {systemTpls.map(tpl => (
                    <TemplateCard key={tpl.id} tpl={tpl}
                      onPreview={() => setPreviewTpl(tpl)}
                      onDuplicate={() => duplicate(tpl.id)}
                      duplicating={duplicating === tpl.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {customTpls.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3">My Templates</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {customTpls.map(tpl => (
                    <TemplateCard key={tpl.id} tpl={tpl}
                      onPreview={() => setPreviewTpl(tpl)}
                      onDuplicate={() => duplicate(tpl.id)}
                      onEdit={() => openEdit(tpl)}
                      onDelete={() => setDeleteId(tpl.id)}
                      duplicating={duplicating === tpl.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <EmptyState icon={FileText} title="No templates" description="Create your first template or duplicate a system template." action={{ label: "New Template", onClick: openCreate }} />
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTpl ? "Edit Template" : "New Template"} size="lg">
        <div className="space-y-4">
          <FormField label="Name *">
            <input className="field" placeholder="e.g. Payment Reminder" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </FormField>
          <FormField label="Subject (for email)">
            <input className="field" placeholder="Email subject line" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
          </FormField>
          <FormField label="Body *" hint="Use variables below to personalize the message.">
            <textarea className="field min-h-[140px]" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Hi {{contact_name}}, …" />
          </FormField>
          <div>
            <p className="label mb-2">Insert Variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <button key={v} type="button" onClick={() => insertVar(v)}
                  className="px-2 py-1 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] text-[11px] rounded-md font-mono transition-colors">
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <><Spinner size={16} /> Saving…</> : "Save Template"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewTpl} onClose={() => setPreviewTpl(null)} title={previewTpl?.name ?? "Preview"} size="md">
        {previewTpl && (
          <div className="space-y-3">
            {previewTpl.subject && (
              <div>
                <p className="label">Subject</p>
                <p className="text-[14px] text-[#374151] bg-[#f9fafb] rounded-lg px-3 py-2">{previewTpl.subject}</p>
              </div>
            )}
            <div>
              <p className="label">Body</p>
              <p className="text-[14px] text-[#374151] bg-[#f9fafb] rounded-lg px-3 py-3 whitespace-pre-wrap leading-relaxed">{previewTpl.body}</p>
            </div>
            {previewTpl.variables?.length > 0 && (
              <div>
                <p className="label">Variables used</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {previewTpl.variables.map((v: string) => (
                    <span key={v} className="px-2 py-0.5 bg-[#e0e7ff] text-[#3730a3] text-[11px] rounded font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteTemplate}
        title="Delete Template"
        message="Delete this template? This cannot be undone."
        danger
      />
    </div>
  );
}

function TemplateCard({ tpl, onPreview, onDuplicate, onEdit, onDelete, duplicating }: {
  tpl: any; onPreview: () => void; onDuplicate: () => void;
  onEdit?: () => void; onDelete?: () => void; duplicating?: boolean;
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-[#1f2937] leading-snug truncate">{tpl.name}</p>
          {tpl.subject && <p className="text-[11px] text-[#6b7280] truncate mt-0.5">{tpl.subject}</p>}
        </div>
        {tpl.is_system && (
          <span className="px-1.5 py-0.5 bg-[#f3f4f6] text-[#6b7280] text-[10px] rounded font-medium flex-shrink-0 flex items-center gap-1">
            <Lock size={9} /> System
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#6b7280] line-clamp-2 flex-1 leading-relaxed">{tpl.body}</p>
      <div className="flex items-center gap-1.5 pt-1 border-t border-[#f3f4f6]">
        <button onClick={onPreview} className="btn btn-ghost btn-sm flex-1"><Eye size={12} /> Preview</button>
        <button onClick={onDuplicate} disabled={duplicating} className="btn btn-ghost btn-sm flex-1">
          {duplicating ? <Spinner size={16} /> : <Copy size={12} />} Copy
        </button>
        {onEdit && <button onClick={onEdit} className="btn btn-ghost btn-sm"><Pencil size={12} /></button>}
        {onDelete && <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"><Trash2 size={12} /></button>}
      </div>
    </div>
  );
}
