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
      if (stored && stored in TRANSLATIONS) setLangState(stored);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }

  return React.createElement(Ctx.Provider, { value: { lang, setLang, t: TRANSLATIONS[lang] } }, children);
}

export function useI18n() { return useContext(Ctx); }
export function useT() { return useContext(Ctx).t; }
