"use client";
import { useEffect, useState } from "react";
import {
  AdminModal, AdminInput, AdminLabel, AdminSelect, AdminBtn, AdminEmpty,
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
    setEditing(null); setModal("create");
  }

  function openEdit(plan: any) {
    setEditing(plan);
    setForm({
      name: plan.name ?? "", description: plan.description ?? "",
      price_monthly: String(plan.price_monthly ?? ""), price_yearly: String(plan.price_yearly ?? ""),
      stripe_price_id_monthly: plan.stripe_price_id_monthly ?? "", stripe_price_id_yearly: plan.stripe_price_id_yearly ?? "",
      max_users: String(plan.max_users ?? ""), max_projects: String(plan.max_projects ?? ""),
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
    const url = editing ? `/api/admin/plans/${editing.id}` : "/api/admin/plans";
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Plans</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{plans.length} pricing plans</p>
        </div>
        <AdminBtn onClick={openCreate}>
          <Plus size={13} /> New Plan
        </AdminBtn>
      </div>

      {loading && <div className="text-center py-16 text-[#9399a8] text-[13px]">Loading…</div>}

      {/* Plan cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plans.map((p: any) => {
            const subCount = Array.isArray(p.subscriptions) ? p.subscriptions.length
              : p.subscriptions?.[0]?.count ?? 0;
            return (
              <div key={p.id} className="bg-white border border-[#e8e9ed] rounded-[14px] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-bold text-[#0d1117]">{p.name}</p>
                    <p className="text-[11px] text-[#9399a8] mt-0.5 line-clamp-2">{p.description ?? "—"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {p.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                <p className="text-[28px] font-bold text-[#0d1117] leading-none mb-1">
                  {fmt(p.price_monthly ?? 0)}
                </p>
                {p.price_yearly && (
                  <p className="text-[11px] text-[#9399a8]">${p.price_yearly}/yr</p>
                )}

                <div className="mt-3 pt-3 border-t border-[#f0f1f5] space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9399a8]">Subscribers</span>
                    <span className="font-semibold text-[#374151]">{subCount}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9399a8]">Users</span>
                    <span className="font-semibold text-[#374151]">{p.max_users ?? "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9399a8]">Projects</span>
                    <span className="font-semibold text-[#374151]">{p.max_projects ?? "Unlimited"}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <AdminBtn onClick={() => openEdit(p)} className="flex-1 justify-center">
                    <Edit2 size={12} /> Edit
                  </AdminBtn>
                  <AdminBtn onClick={() => deletePlan(p.id)} variant="red">
                    <Trash2 size={12} />
                  </AdminBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            <label htmlFor="is_active" className="text-[12px] text-[#6b7280]">Active (visible to new subscribers)</label>
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-[#e8e9ed] pt-3">
          <AdminBtn onClick={() => setModal(null)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={savePlan} disabled={saving || !form.name}>
            {saving ? "Saving…" : modal === "edit" ? "Save Changes" : "Create Plan"}
          </AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
