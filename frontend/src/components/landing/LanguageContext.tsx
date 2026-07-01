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

export function LandingLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ro');
  return (
    <LandingLanguageContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  return useContext(LandingLanguageContext);
}
