import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { Recipe } from '../types/recipe';

function extractCreatedAtFromId(recipeId: string): number {
  const match = recipeId.match(/-(\d{10,})$/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByNewest(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort((a, b) => {
    const byTime = extractCreatedAtFromId(b.id) - extractCreatedAtFromId(a.id);
    if (byTime !== 0) {
      return byTime;
    }

    return a.title.localeCompare(b.title);
  });
}

export function HomePage() {
  const { t } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();

  const latestRecipes = useMemo(() => {
    return sortByNewest(recipes).slice(0, 4);
  }, [recipes]);

  return (
    <section aria-label="home-page" className="min-h-[320px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('homeLatestRecipesTitle')}</h2>
          <p className="text-sm text-slate-600">{t('homeLatestRecipesSubtitle')}</p>
        </div>
        <Link className="text-sm font-medium text-slate-900 underline underline-offset-4" to="/recipes">
          {t('recipesTitle')}
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}
      {error && <p className="text-sm text-amber-700">{error}</p>}

      {!isLoading && latestRecipes.length === 0 && <p className="text-sm text-slate-500">{t('noRecipes')}</p>}

      <RecipeList recipes={latestRecipes} />
    </section>
  );
}
