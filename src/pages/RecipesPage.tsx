import { useEffect, useMemo, useRef, useState } from 'react';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';

export function RecipesPage() {
  const { t } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();
  const pageSizeOptions = [6, 12, 24];
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(recipes.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || isLoading || currentPage >= totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setCurrentPage((page) => Math.min(totalPages, page + 1));
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [currentPage, isLoading, totalPages]);

  const paginatedRecipes = useMemo(() => {
    const end = currentPage * pageSize;
    return recipes.slice(0, end);
  }, [currentPage, pageSize, recipes]);

  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('recipesTitle')}</h2>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>{t('recipesPerPage')}</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            onChange={(event) => setPageSize(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={`page-size-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {!isLoading && recipes.length > 0 && (
          <p className="text-sm text-slate-500">
            {t('paginationPage')} {currentPage} {t('paginationOf')} {totalPages}
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && recipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noRecipes')}</p>
      )}

      <RecipeList recipes={paginatedRecipes} />

      {!isLoading && currentPage < totalPages && (
        <div className="mt-4 flex justify-center">
          <span className="text-sm text-slate-500">{t('loadingRecipes')}</span>
        </div>
      )}

      <div ref={loadMoreTriggerRef} className="h-6 w-full" aria-hidden="true" />

      {!isLoading && recipes.length > 0 && (
        <div className="mt-5 flex items-center gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            type="button"
          >
            {t('paginationPrevious')}
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            type="button"
          >
            {t('paginationNext')}
          </button>
        </div>
      )}
    </section>
  );
}
