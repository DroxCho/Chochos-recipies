import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';

export function RecipesPage() {
  const { t } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();

  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('recipesTitle')}</h2>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && recipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noRecipes')}</p>
      )}

      <RecipeList recipes={recipes} />
    </section>
  );
}
