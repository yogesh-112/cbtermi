"use client";
import { ReactNode, useState, useEffect } from "react";
import { X } from "lucide-react";

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-ghost btn" onClick={onClose}>Cancel</button>
        <button className={danger ? "btn-danger btn" : "btn-primary btn"} onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-slate-300 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}
      className="border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    viewed: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    converted: "bg-teal-100 text-teal-700",
    paid: "bg-green-100 text-green-700",
    partially_paid: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700",
    voided: "bg-slate-100 text-slate-500",
    active: "bg-green-100 text-green-700",
    on_hold: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    lead: "bg-violet-100 text-violet-700",
    customer: "bg-green-100 text-green-700",
    direct_contact: "bg-blue-100 text-blue-700",
    trial: "bg-yellow-100 text-yellow-700",
    monthly: "bg-blue-100 text-blue-700",
    yearly: "bg-green-100 text-green-700",
  };
  const cls = map[status.toLowerCase()] ?? "bg-slate-100 text-slate-600";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
let toastFn: ((msg: string, type?: ToastType) => void) | null = null;

export function ToastProvider() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: ToastType }>>([]);
  useEffect(() => {
    toastFn = (msg, type = "success") => {
      const id = Date.now();
      setToasts((t) => [...t, { id, msg, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    return () => { toastFn = null; };
  }, []);
  const colors: Record<ToastType, string> = {
    success: "bg-green-600", error: "bg-red-600", info: "bg-brand-navy",
  };
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(({ id, msg, type }) => (
        <div key={id} className={`${colors[type]} text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-5`}>
          {msg}
        </div>
      ))}
    </div>
  );
}

export function toast(msg: string, type: ToastType = "success") {
  toastFn?.(msg, type);
}

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="field max-w-xs"
    />
  );
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`field ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = "navy" }: {
  label: string; value: string | number; sub?: string; color?: "navy" | "green" | "yellow" | "red";
}) {
  const colors = {
    navy:   "from-brand-navy to-brand-navy-mid text-white",
    green:  "from-brand-green to-brand-green-dark text-white",
    yellow: "from-yellow-400 to-yellow-500 text-white",
    red:    "from-red-500 to-red-600 text-white",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-5">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab
              ? "border-brand-navy text-brand-navy"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export function FormField({ label, error, children, required }: {
  label: string; error?: string; children: ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
