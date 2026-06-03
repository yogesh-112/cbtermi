"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  AdminTable, AdminTr, AdminTd, AdminModal,
  AdminInput, AdminLabel, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [form, setForm] = useState({
    code: "", description: "", discount_percent: "20", max_uses: "", expires_at: "", stripe_coupon_id: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/coupons").then(r => r.json()).then(d => setCoupons(d.coupons ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.discount_percent) return;
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setModal(false); setForm({ code: "", description: "", discount_percent: "20", max_uses: "", expires_at: "", stripe_coupon_id: "" }); load(); }
    else { const d = await res.json(); alert(d.message); }
  };

  const toggle = async (id: string, is_active: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    load();
  };

  const del = async (id: string) => {
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setConfirmDel(null);
    load();
  };

  return (
    <div className="space-y-5 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0d1117]">Coupon Codes</h1>
          <p className="text-[13px] text-[#9399a8] mt-0.5">Create and manage discount coupons for subscription plans.</p>
        </div>
        <AdminBtn onClick={() => setModal(true)}>
          <Plus size={13} /> New Coupon
        </AdminBtn>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#f0f1f5] animate-pulse" />)}</div>
      ) : (
        <AdminTable headers={["Code", "Discount", "Uses", "Max Uses", "Expires", "Status", ""]}>
          {coupons.length === 0 && <AdminEmpty message="No coupon codes yet." />}
          {coupons.map(c => (
            <AdminTr key={c.id}>
              <AdminTd>
                <code className="text-[13px] font-bold text-[#0d1117] bg-[#f0f1f5] px-2 py-0.5 rounded">{c.code}</code>
                {c.description && <p className="text-[11px] text-[#9399a8] mt-0.5">{c.description}</p>}
              </AdminTd>
              <AdminTd>
                <span className="text-[13px] font-semibold text-brand-green">{c.discount_percent}% off</span>
              </AdminTd>
              <AdminTd className="text-[13px] text-[#374151]">{c.uses_count ?? 0}</AdminTd>
              <AdminTd className="text-[13px] text-[#374151]">{c.max_uses ?? "∞"}</AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">
                {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
              </AdminTd>
              <AdminTd>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </AdminTd>
              <AdminTd>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggle(c.id, !c.is_active)} className="p-1.5 rounded text-[#9399a8] hover:text-[#0d1117] hover:bg-[#f0f1f5]" title="Toggle">
                    {c.is_active ? <ToggleRight size={16} className="text-brand-green" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded text-[#9399a8] hover:text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}

      {/* Create modal */}
      <AdminModal open={modal} onClose={() => setModal(false)} title="Create Coupon Code">
        <div className="space-y-4">
          <div>
            <AdminLabel>Code *</AdminLabel>
            <AdminInput value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER20" />
          </div>
          <div>
            <AdminLabel>Description</AdminLabel>
            <AdminInput value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal note about this coupon" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <AdminLabel>Discount % *</AdminLabel>
              <AdminInput type="number" min="1" max="100" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} />
            </div>
            <div>
              <AdminLabel>Max Uses</AdminLabel>
              <AdminInput type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div>
              <AdminLabel>Expires</AdminLabel>
              <AdminInput type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
          </div>
          <div>
            <AdminLabel>Stripe Promotion Code ID (optional)</AdminLabel>
            <AdminInput value={form.stripe_coupon_id} onChange={e => setForm(f => ({ ...f, stripe_coupon_id: e.target.value.trim() }))} placeholder="promo_xxxx — from Stripe Dashboard > Coupons" />
            <p className="text-[11px] text-[#9399a8] mt-1">
              Link this coupon to a Stripe promotion code so the discount auto-applies at checkout.
              Get the ID from <strong>Stripe Dashboard → Billing → Coupons → Promotion codes</strong>.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <AdminBtn onClick={() => setModal(false)} variant="ghost">Cancel</AdminBtn>
            <AdminBtn onClick={create} disabled={saving}>{saving ? "Creating…" : "Create Coupon"}</AdminBtn>
          </div>
        </div>
      </AdminModal>

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-[16px] font-bold text-[#0d1117] mb-2">Delete coupon?</h3>
            <p className="text-[13px] text-[#6b7280] mb-4">Delete <code className="font-bold">{confirmDel.code}</code>? This cannot be undone.</p>
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
