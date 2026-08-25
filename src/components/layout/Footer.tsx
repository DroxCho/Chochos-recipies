import { useLanguage } from '../../i18n/useLanguage';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 text-sm text-slate-500">
        <p>© {year} {t('footerBrand')}</p>
      </div>
    </footer>
  );
}
