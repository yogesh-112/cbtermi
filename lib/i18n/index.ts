"use client";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import en, { type Translations } from "./en";
import es from "./es";
import pt from "./pt";

export type Lang = "en" | "es" | "pt";
export type { Translations };

const TRANSLATIONS: Record<Lang, Translations> = { en, es, pt };
const STORAGE_KEY = "cb_lang";

interface I18nContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const Ctx = createContext<I18nContext>({ lang: "en", setLang: () => {}, t: en });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && stored in TRANSLATIONS) {
        setLangState(stored);
        document.documentElement.setAttribute("lang", stored);
      }
    } catch {}
  }, []);

  // Keep in sync with the landing page's cb:langchange event (cross-page sync)
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail?.lang as Lang;
      if (code && code in TRANSLATIONS) {
        setLangState(code);
        try { localStorage.setItem(STORAGE_KEY, code); } catch {}
        document.documentElement.setAttribute("lang", code);
      }
    };
    window.addEventListener("cb:langchange", handler);
    return () => window.removeEventListener("cb:langchange", handler);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    try { document.documentElement.setAttribute("lang", l); } catch {}
    // Dispatch so landing page lang switcher stays in sync if both are mounted
    try { window.dispatchEvent(new CustomEvent("cb:langchange", { detail: { lang: l } })); } catch {}
  }

  return React.createElement(Ctx.Provider, { value: { lang, setLang, t: TRANSLATIONS[lang] } }, children);
}

export function useI18n() { return useContext(Ctx); }
export function useT() { return useContext(Ctx).t; }
