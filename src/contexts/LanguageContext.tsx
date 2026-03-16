import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Lang, t, TranslationKey } from "@/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("vibe-music-lang");
      if (stored === "he" || stored === "en") return stored;
    } catch {}
    return "en";
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("vibe-music-lang", newLang);
    } catch {}
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => t(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
