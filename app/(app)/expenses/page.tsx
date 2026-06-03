"use client";
import { useEffect, useState } from "react";
import { Plus, Receipt, TrendingDown, Filter } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const CATEGORIES = [
  "Materials", "Labor", "Equipment", "Fuel",
  "Subcontractor", "Permits", "Other",
];

const BLANK_FORM = {
  title: "", category: "Materials", amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  project_id: "", description: "", receipt_url: "",
};

export default function ExpensesPage() {
  const t = useT();
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [projects, setProjects]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ ...BLANK_FORM });
  const [filterCat, setFilterCat] = useState("");
  const [filterProj, setFilterProj] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (filterCat)  params.set("category",   filterCat);
    if (filterProj) params.set("project_id", filterProj);
    fetch(`/api/expenses?${params}`).then(r => r.json()).then(d => {
      setExpenses(d.expenses ?? []);
      setTotal(d.total ?? 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/projects?limit=200").then(r => r.json()).then(d => setProjects(d.projects ?? []));
  }, [filterCat, filterProj]);

  const openCreate = () => { setEditing(null); setForm({ ...BLANK_FORM }); setModal(true); };
  const openEdit   = (exp: any) => {
    setEditing(exp);
    setForm({
      title:        exp.title,
      category:     exp.category,
      amount:       String(exp.amount),
      expense_date: exp.expense_date,
      project_id:   exp.project_id ?? "",
      description:  exp.description ?? "",
      receipt_url:  exp.receipt_url ?? "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.title.trim())  { toast(t.common.required, "error"); return; }
    if (!form.amount || parseFloat(form.amount) < 0) { toast(t.common.required, "error"); return; }
    setSaving(true);
    const body = {
      ...form,
      amount: parseFloat(form.amount),
      project_id: form.project_id || null,
    };
    const [url, method] = editing
      ? [`/api/expenses/${editing.id}`, "PATCH"]
      : ["/api/expenses", "POST"];
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast(editing ? t.expenses.updated : t.expenses.created);
      setModal(false);
      load();
    } else {
      const d = await res.json();
      toast(d.message ?? "Failed to save", "error");
    }
  };

  const del = async (exp: any) => {
    const res = await fetch(`/api/expenses/${exp.id}`, { method: "DELETE" });
    setConfirmDel(null);
    if (res.ok) { toast(t.expenses.deleted); load(); }
    else toast("Failed to delete", "error");
  };

  // Stats
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + (e.amount ?? 0), 0);
  const grandTotal = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const catTotals = CATEGORIES.map(cat => ({
    cat,
    amt: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount ?? 0), 0),
  })).filter(x => x.amt > 0).sort((a, b) => b.amt - a.amt);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.expenses.title}</h1>
          <p className="page-desc">
            {fmt(grandTotal)} {t.expenses.totalSpent} · {total} {t.expenses.totalExpenses}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/expenses?format=csv" download className="btn btn-outline btn-sm">↓ CSV</a>
          <button className="btn btn-green" onClick={openCreate}>
            <Plus size={15} /> {t.expenses.addExpense}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">{t.expenses.thisMonth}</span>
          <span className="mini-stat-value text-[20px]">{fmt(thisMonth)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">
            {expenses.filter(e => {
              const d = new Date(e.expense_date);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length} {t.expenses.entries}
          </span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">{t.expenses.allTime}</span>
          <span className="mini-stat-value text-[20px]">{fmt(grandTotal)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{total} {t.expenses.totalExpenses}</span>
        </div>
        {catTotals[0] && (
          <div className="mini-stat mini-stat-blue">
            <span className="mini-stat-label">{t.expenses.topCategory}</span>
            <span className="mini-stat-value text-[20px]">{fmt(catTotals[0].amt)}</span>
            <span className="text-[11px] text-[#8a8fa3] mt-0.5">{catTotals[0].cat}</span>
          </div>
        )}
        {catTotals[1] && (
          <div className="mini-stat mini-stat-amber">
            <span className="mini-stat-label">{catTotals[1].cat}</span>
            <span className="mini-stat-value text-[20px]">{fmt(catTotals[1].amt)}</span>
            <span className="text-[11px] text-[#8a8fa3] mt-0.5">{t.expenses.secondCategory}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-[12px] text-[#8a8fa3]">
          <Filter size={13} /> {t.expenses.filterBy}:
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="field py-1.5 text-[12px] w-auto min-w-[140px]">
          <option value="">{t.expenses.allCategories}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          className="field py-1.5 text-[12px] w-auto min-w-[160px]">
          <option value="">{t.expenses.allProjects}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filterCat || filterProj) && (
          <button onClick={() => { setFilterCat(""); setFilterProj(""); }}
            className="text-[12px] text-[#8a8fa3] hover:text-red-500 underline">
            {t.expenses.clearFilters}
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-16 skeleton" />)
        ) : expenses.length === 0 ? (
          <EmptyState icon={<Receipt size={36} />} title={t.expenses.noExpenses} description={t.expenses.noExpensesDesc}
            action={<button className="btn btn-green btn-sm" onClick={openCreate}><Plus size={14} /> {t.expenses.addExpense}</button>} />
        ) : expenses.map(e => (
          <div key={e.id} className="mobile-card" onClick={() => openEdit(e)}>
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#0c1226] text-[14px]">{e.title}</p>
                <p className="text-xs text-[#8a8fa3] mt-0.5">
                  {e.category}{e.projects ? ` · ${e.projects.name}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600 text-[14px]">{fmt(e.amount)}</p>
                <p className="text-xs text-[#8a8fa3]">{fmtDate(e.expense_date)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.expenses.dateCol}</th>
              <th>{t.expenses.titleCol}</th>
              <th>{t.expenses.categoryCol}</th>
              <th>{t.expenses.projectCol}</th>
              <th>{t.expenses.amountCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[#8a8fa3]">{t.common.loading}</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState icon={<Receipt size={40} />} title={t.expenses.noExpenses} description={t.expenses.noExpensesDesc}
                  action={<button className="btn btn-green btn-sm" onClick={openCreate}><Plus size={14} /> {t.expenses.addExpense}</button>} />
              </td></tr>
            ) : expenses.map(e => (
              <tr key={e.id}>
                <td className="text-[#8a8fa3] text-[12px]">{fmtDate(e.expense_date)}</td>
                <td>
                  <button onClick={() => openEdit(e)}
                    className="text-brand-navy hover:underline text-[13px] font-medium text-left">
                    {e.title}
                  </button>
                  {e.description && <p className="text-[11px] text-[#8a8fa3] truncate max-w-[240px]">{e.description}</p>}
                </td>
                <td>
                  <span className="badge bg-[#f3f4f6] text-[#4a5168]">{e.category}</span>
                </td>
                <td className="text-[13px] text-[#4a5168]">
                  {e.projects?.name ?? <span className="text-[#8a8fa3]">—</span>}
                </td>
                <td className="font-semibold text-red-600 text-[13px]">{fmt(e.amount)}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(e)}
                      className="text-[11px] text-[#8a8fa3] hover:text-brand-navy px-2 py-1 rounded hover:bg-[#f3f4f6]">
                      {t.common.edit}
                    </button>
                    <button onClick={() => setConfirmDel(e)}
                      className="text-[11px] text-[#8a8fa3] hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                      {t.common.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div className="card p-5 mt-5">
          <h2 className="section-title mb-4">
            <TrendingDown size={15} className="inline mr-1.5 text-red-500" />
            {t.expenses.breakdown}
          </h2>
          <div className="space-y-3">
            {catTotals.map(({ cat, amt }) => (
              <div key={cat}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-[#4a5168] font-medium">{cat}</span>
                  <span className="text-red-600 font-semibold">{fmt(amt)}</span>
                </div>
                <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <div className="h-full bg-red-400/60 rounded-full"
                    style={{ width: `${grandTotal > 0 ? (amt / grandTotal) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? t.expenses.editExpense : t.expenses.addExpense} size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">{t.expenses.titleRequired}</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder={t.expenses.titlePlaceholder} className="field" />
          </div>
          <div>
            <label className="label">{t.expenses.categoryRequired}</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.expenses.amountRequired}</label>
            <input type="number" step="0.01" min="0" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00" className="field" />
          </div>
          <div>
            <label className="label">{t.expenses.dateLabel}</label>
            <input type="date" value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">{t.expenses.projectLabel}</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
              <option value="">{t.expenses.noProject}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.expenses.descriptionLabel}</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={t.expenses.descriptionPlaceholder} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.expenses.receiptLabel}</label>
            <input value={form.receipt_url} onChange={e => setForm({ ...form, receipt_url: e.target.value })}
              placeholder="https://…" className="field" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t.common.cancel}</button>
          <button className="btn btn-green" onClick={save} disabled={saving}>
            {saving ? t.common.saving : editing ? t.common.save : t.expenses.addExpense}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && del(confirmDel)}
        title={t.expenses.deleteTitle}
        message={confirmDel ? `${t.expenses.deleteMessage} "${confirmDel.title}" (${fmt(confirmDel.amount)})` : ""}
        danger
      />
    </div>
  );
}
