import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("verifai-lang") as Lang | null) : null;
    if (saved === "en" || saved === "bn") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("verifai-lang", l);
  };
  return (
    <LangCtx.Provider value={{ lang, setLang, toggle: () => setLang(lang === "en" ? "bn" : "en") }}>
      {children}
    </LangCtx.Provider>
  );
}
export const useLang = () => useContext(LangCtx);
export const t = (en: string, bn: string, lang: Lang) => (lang === "bn" ? bn : en);
