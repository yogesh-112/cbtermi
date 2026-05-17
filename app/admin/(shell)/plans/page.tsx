"use client";
import { useEffect, useState } from "react";
import {
  AdminTable, AdminTr, AdminTd, AdminModal,
  AdminInput, AdminLabel, AdminBtn, AdminSelect, AdminEmpty,
} from "@/components/admin/ui";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price_monthly: "", price_yearly: "",
    stripe_price_id_monthly: "", stripe_price_id_yearly: "",
    max_users: "", max_projects: "", is_active: true,
  });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/plans").then(r => r.json()).then(d => setPlans(d.plans ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ name: "", description: "", price_monthly: "", price_yearly: "", stripe_price_id_monthly: "", stripe_price_id_yearly: "", max_users: "", max_projects: "", is_active: true });
    setEditing(null);
    setModal("create");
  }

  function openEdit(plan: any) {
    setEditing(plan);
    setForm({
      name: plan.name ?? "",
      description: plan.description ?? "",
      price_monthly: String(plan.price_monthly ?? ""),
      price_yearly: String(plan.price_yearly ?? ""),
      stripe_price_id_monthly: plan.stripe_price_id_monthly ?? "",
      stripe_price_id_yearly: plan.stripe_price_id_yearly ?? "",
      max_users: String(plan.max_users ?? ""),
      max_projects: String(plan.max_projects ?? ""),
      is_active: plan.is_active ?? true,
    });
    setModal("edit");
  }

  async function savePlan() {
    setSaving(true);
    const body = {
      ...form,
      price_monthly: parseFloat(form.price_monthly) || 0,
      price_yearly:  parseFloat(form.price_yearly)  || null,
      max_users:     form.max_users    ? parseInt(form.max_users)    : null,
      max_projects:  form.max_projects ? parseInt(form.max_projects) : null,
    };
    const url  = editing ? `/api/admin/plans/${editing.id}` : "/api/admin/plans";
    const meth = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method: meth, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { load(); setModal(null); }
    setSaving(false);
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this plan? Existing subscribers will not be affected.")) return;
    await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    load();
  }

  const fmt = (n: number) => n === 0 ? "Free" : `$${n}/mo`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Plans</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{plans.length} pricing plans</p>
        </div>
        <AdminBtn onClick={openCreate} variant="default">
          <Plus size={13} /> New Plan
        </AdminBtn>
      </div>

      <AdminTable headers={["Plan", "Price", "Subscribers", "Limits", "Active", ""]}>
        {loading && <tr><td colSpan={6} className="py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>}
        {!loading && plans.length === 0 && <AdminEmpty message="No plans found" />}
        {plans.map((p: any) => {
          const subCount = Array.isArray(p.subscriptions) ? p.subscriptions.length
            : p.subscriptions?.[0]?.count ?? 0;
          return (
            <AdminTr key={p.id}>
              <AdminTd>
                <div>
                  <p className="text-white font-semibold text-[13px]">{p.name}</p>
                  <p className="text-[11px] text-white/30 line-clamp-1">{p.description ?? "—"}</p>
                </div>
              </AdminTd>
              <AdminTd className="font-medium text-white">{fmt(p.price_monthly ?? 0)}</AdminTd>
              <AdminTd className="text-[13px]">
                <span className="text-white/70">{subCount}</span>
              </AdminTd>
              <AdminTd className="text-[12px] text-white/40">
                {p.max_users ? `${p.max_users} users` : "Unlimited"} · {p.max_projects ? `${p.max_projects} proj` : "Unlimited"}
              </AdminTd>
              <AdminTd>
                {p.is_active
                  ? <CheckCircle size={14} className="text-emerald-400" />
                  : <XCircle size={14} className="text-white/20" />}
              </AdminTd>
              <AdminTd>
                <div className="flex items-center gap-1">
                  <AdminBtn onClick={() => openEdit(p)} variant="ghost"><Edit2 size={12} /></AdminBtn>
                  <AdminBtn onClick={() => deletePlan(p.id)} variant="red"><Trash2 size={12} /></AdminBtn>
                </div>
              </AdminTd>
            </AdminTr>
          );
        })}
      </AdminTable>

      {/* Create / Edit modal */}
      <AdminModal open={!!modal} onClose={() => setModal(null)} title={modal === "edit" ? "Edit Plan" : "New Plan"} width="max-w-[560px]">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <AdminLabel>Plan Name</AdminLabel>
            <AdminInput value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Pro" />
          </div>
          <div className="col-span-2">
            <AdminLabel>Description</AdminLabel>
            <AdminInput value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="For growing contractors" />
          </div>
          <div>
            <AdminLabel>Monthly Price ($)</AdminLabel>
            <AdminInput type="number" value={form.price_monthly} onChange={e => setForm(f => ({...f, price_monthly: e.target.value}))} placeholder="49" />
          </div>
          <div>
            <AdminLabel>Yearly Price ($)</AdminLabel>
            <AdminInput type="number" value={form.price_yearly} onChange={e => setForm(f => ({...f, price_yearly: e.target.value}))} placeholder="490" />
          </div>
          <div>
            <AdminLabel>Max Users</AdminLabel>
            <AdminInput type="number" value={form.max_users} onChange={e => setForm(f => ({...f, max_users: e.target.value}))} placeholder="Unlimited" />
          </div>
          <div>
            <AdminLabel>Max Projects</AdminLabel>
            <AdminInput type="number" value={form.max_projects} onChange={e => setForm(f => ({...f, max_projects: e.target.value}))} placeholder="Unlimited" />
          </div>
          <div className="col-span-2">
            <AdminLabel>Stripe Monthly Price ID</AdminLabel>
            <AdminInput value={form.stripe_price_id_monthly} onChange={e => setForm(f => ({...f, stripe_price_id_monthly: e.target.value}))} placeholder="price_xxx" />
          </div>
          <div className="col-span-2">
            <AdminLabel>Stripe Yearly Price ID</AdminLabel>
            <AdminInput value={form.stripe_price_id_yearly} onChange={e => setForm(f => ({...f, stripe_price_id_yearly: e.target.value}))} placeholder="price_xxx" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-4 h-4 accent-[#b33a4b]" />
            <label htmlFor="is_active" className="text-[12px] text-white/60">Active (visible to new subscribers)</label>
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-white/[0.06] pt-3">
          <AdminBtn onClick={() => setModal(null)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={savePlan} variant="default" disabled={saving || !form.name}>
            {saving ? "Saving…" : modal === "edit" ? "Save Changes" : "Create Plan"}
          </AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
