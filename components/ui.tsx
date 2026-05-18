"use client";
import { ReactNode, useState, useEffect, useRef, ComponentType } from "react";
import { X, CheckCircle, AlertCircle, Info, ChevronDown, MoreHorizontal } from "lucide-react";

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white w-full ${widths[size]} sm:rounded-modal rounded-t-modal shadow-modal
                       max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-slide-in-bottom sm:animate-scale-in`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7e6e1] flex-shrink-0">
          <h2 className="text-base font-semibold text-[#0c1226]" style={{ letterSpacing: "-0.02em" }}>{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-[#4a5168] hover:bg-[#f0efea] transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
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
      <p className="text-sm text-[#4a5168] mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={() => { onConfirm(); onClose(); }}>
          {danger ? "Delete" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: ComponentType<{ size?: number }> | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode | { label: string; onClick: () => void };
}) {
  const IconEl = typeof icon === "function"
    ? (() => { const C = icon as ComponentType<{ size?: number }>; return <C size={40} />; })()
    : icon;
  const ActionEl = action && typeof action === "object" && "label" in (action as object)
    ? (() => { const a = action as { label: string; onClick: () => void }; return <button className="btn btn-primary btn-sm" onClick={a.onClick}>{a.label}</button>; })()
    : action as ReactNode;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-[#d8d6cf] mb-4 p-4 bg-[#f6f6f3] rounded-2xl">{IconEl}</div>
      <h3 className="text-base font-semibold text-[#4a5168] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#8a8fa3] mb-5 max-w-xs leading-relaxed">{description}</p>}
      {ActionEl}
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

// ─── PAGE LOADING SKELETON ────────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-card" />)}
      </div>
      <div className="h-64 skeleton rounded-card" />
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft:          "bg-[#f0efea] text-[#4a5168]",
    sent:           "bg-blue-50 text-blue-700",
    viewed:         "bg-violet-50 text-violet-700",
    approved:       "bg-brand-green-light text-brand-green",
    rejected:       "bg-red-50 text-red-700",
    converted:      "bg-teal-50 text-teal-700",
    paid:           "bg-brand-green-light text-brand-green",
    partially_paid: "bg-amber-50 text-amber-700",
    overdue:        "bg-red-50 text-red-700",
    voided:         "bg-[#f0efea] text-[#8a8fa3]",
    active:         "bg-brand-green-light text-brand-green",
    on_hold:        "bg-amber-50 text-amber-700",
    completed:      "bg-blue-50 text-blue-700",
    cancelled:      "bg-red-50 text-red-700",
    lead:           "bg-violet-50 text-violet-700",
    customer:       "bg-brand-green-light text-brand-green",
    direct_contact: "bg-blue-50 text-blue-700",
    trial:          "bg-amber-50 text-amber-700",
    monthly:        "bg-blue-50 text-blue-700",
    yearly:         "bg-brand-green-light text-brand-green",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-[#f0efea] text-[#4a5168]";
  const label = status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";
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

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors: Record<ToastType, string> = {
    success: "bg-[#0c1226] text-white",
    error:   "bg-red-600 text-white",
    info:    "bg-brand-navy text-white",
  };

  return (
    <div className="fixed bottom-20 sm:bottom-5 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      {toasts.map(({ id, msg, type }) => {
        const Icon = icons[type];
        return (
          <div key={id}
            className={`${colors[type]} text-sm px-4 py-3 rounded-xl shadow-modal flex items-center gap-2.5 animate-slide-in-right pointer-events-auto`}>
            <Icon size={15} className="flex-shrink-0 opacity-90" />
            <span className="font-medium">{msg}</span>
          </div>
        );
      })}
    </div>
  );
}

export function toast(msg: string, type: ToastType = "success") {
  toastFn?.(msg, type);
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = "navy" }: {
  label: string; value: string | number; sub?: string;
  icon?: ReactNode; color?: "navy" | "green" | "yellow" | "red";
}) {
  const accent = {
    navy:   "text-brand-navy",
    green:  "text-brand-green",
    yellow: "text-amber-500",
    red:    "text-red-600",
  };
  const bg = {
    navy:   "bg-brand-blue-50",
    green:  "bg-brand-green-light",
    yellow: "bg-amber-50",
    red:    "bg-red-50",
  };
  return (
    <div className="stat-card">
      {icon && (
        <div className={`w-9 h-9 rounded-xl ${bg[color]} flex items-center justify-center mb-1 ${accent[color]}`}>
          {icon}
        </div>
      )}
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${accent[color]}`}>{value}</p>
      {sub && <p className="text-xs text-[#8a8fa3]">{sub}</p>}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: Array<string | { id: string; label: string }>;
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="tabs-bar">
      {tabs.map((tab) => {
        const id = typeof tab === "string" ? tab : tab.id;
        const label = typeof tab === "string" ? tab : tab.label;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`tab-btn ${active === id ? "active" : ""}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export function FormField({ label, error, children, required, hint }: {
  label: string; error?: string; children: ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-[#8a8fa3] font-normal ml-1.5">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">{error}</p>}
    </div>
  );
}

// ─── ACTION MENU (row actions dropdown) ──────────────────────────────────────
export function ActionMenu({ items }: {
  items: Array<{ label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="btn btn-ghost btn-icon p-1.5 text-[#8a8fa3]">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 overflow-hidden animate-scale-in">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick(); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors
                ${item.danger ? "text-red-600 hover:bg-red-50" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
              {item.icon && <span className="opacity-60">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="field" />
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

// ─── INFO TOOLTIP ─────────────────────────────────────────────────────────────
export function InfoTooltip({ text, side = "top" }: { text: string; side?: "top" | "bottom" | "left" | "right" }) {
  const [visible, setVisible] = useState(false);
  const positions: Record<string, string> = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}>
      <button type="button" aria-label="More info" tabIndex={0}
        className="w-4 h-4 rounded-full bg-[#e5e7eb] text-[#6b7280] hover:bg-[#d1d5db] flex items-center justify-center text-[10px] font-bold leading-none transition-colors flex-shrink-0">
        i
      </button>
      {visible && (
        <span className={`absolute z-[60] w-56 text-[12px] leading-relaxed bg-[#0c1226] text-white px-3 py-2 rounded-xl shadow-lg pointer-events-none ${positions[side]}`}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── INFO BANNER ──────────────────────────────────────────────────────────────
export function InfoBanner({ children, variant = "info" }: {
  children: ReactNode; variant?: "info" | "success" | "warning" | "error";
}) {
  const styles = {
    info:    "bg-blue-50 border-blue-100 text-blue-800",
    success: "bg-brand-green-light border-brand-green/20 text-brand-green",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    error:   "bg-red-50 border-red-100 text-red-700",
  };
  return (
    <div className={`border rounded-xl p-4 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
}
