import { createContext, useContext, useState } from 'react';
import en from '../../locales/landing.en.json';
import ro from '../../locales/landing.ro.json';

export type Lang = 'en' | 'ro';
export type Translations = typeof en;

const translations: Record<Lang, Translations> = { en, ro: ro as unknown as Translations };

interface LandingLanguageContextValue {
  t: Translations;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LandingLanguageContext = createContext<LandingLanguageContextValue>({
  t: ro as unknown as Translations,
  lang: 'ro',
  setLang: () => {},
});

const STORAGE_KEY = 'logicore-lang';

function readStoredLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'ro' ? stored : 'ro';
}

export function LandingLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  };

  return (
    <LandingLanguageContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  return useContext(LandingLanguageContext);
}
