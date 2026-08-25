import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from './translations';
import { LanguageContext } from './languageContext';
import { translations } from './translations';

const LANGUAGE_KEY = 'recipes_language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'bg';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      t: (key: keyof (typeof translations)['bg']) => translations[language][key],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
