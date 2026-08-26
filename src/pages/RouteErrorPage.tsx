import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';

export function RouteErrorPage() {
  const error = useRouteError();
  const { language, t } = useLanguage();

  let details = t('appErrorUnexpectedDetails');

  if (isRouteErrorResponse(error)) {
    details = `${t('appErrorHttpPrefix')} ${error.status}`;
    if (language !== 'bg' && error.statusText) {
      details = `${details}: ${error.statusText}`;
    }
  } else if (error instanceof Error) {
    details = language === 'bg' ? t('appErrorUnexpectedDetails') : error.message;
  }

  return (
    <section className="mx-auto mt-10 max-w-2xl rounded-xl border border-rose-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">{t('appErrorTitle')}</h2>
      <p className="mt-2 text-sm text-slate-600">{t('appErrorDescription')}</p>
      <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">{details}</p>
      <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to="/recipes">
        {t('backToRecipes')}
      </Link>
    </section>
  );
}
