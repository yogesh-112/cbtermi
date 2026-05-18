"use client";
import { useState } from "react";
import { Globe } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English",   short: "EN" },
  { code: "es", label: "Español",   short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
];

export default function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "auth" }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  const btn =
    variant === "auth"
      ? "flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium text-[#4a5168] hover:bg-[#f6f6f3] border border-[#e7e6e1] transition-colors bg-white"
      : "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-[#4a5168] hover:bg-[#f6f6f3] border border-[#e7e6e1] transition-colors";

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={btn}>
        <Globe size={13} />
        <span>{lang.toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 right-0 w-40 bg-white border border-[#e7e6e1] rounded-xl shadow-lg z-50 overflow-hidden">
            {LANGS.map(l => (
              <button key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors
                  ${lang === l.code ? "text-brand-navy font-semibold bg-[#eef2ff]" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}
              >
                <span className="font-mono text-[11px] text-[#8a8fa3] w-6 flex-shrink-0">{l.short}</span>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
