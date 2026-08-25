import type { Language } from '../../i18n/translations';
import { useLanguage } from '../../i18n/useLanguage';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  function onLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{t('languageLabel')}:</span>
      <button
        className={`rounded px-2 py-1 text-xs ${language === 'bg' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
        onClick={() => onLanguageChange('bg')}
        type="button"
      >
        BG
      </button>
      <button
        className={`rounded px-2 py-1 text-xs ${language === 'en' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
        onClick={() => onLanguageChange('en')}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
