import { createContext, useContext, useState, type ReactNode } from 'react';
import { ui, type Lang } from '../i18n/ui';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof ui)['en'];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('news-cli-lang') : null;
    return saved === 'en' || saved === 'zh' ? saved : 'zh';
  });

  const value: I18nContextValue = {
    lang,
    setLang: (next) => {
      setLang(next);
      localStorage.setItem('news-cli-lang', next);
    },
    t: ui[lang],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
