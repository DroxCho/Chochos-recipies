import { Link, useLocation, useParams } from 'react-router-dom';
import { useRecipeDetails } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';

interface RecipeDetailsLocationState {
  created?: boolean;
}

export function RecipeDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useLanguage();
  const { recipe, isLoading, error } = useRecipeDetails(id);
  const locationState = location.state as RecipeDetailsLocationState | null;
  const showCreatedMessage = Boolean(locationState?.created);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">{t('loadingRecipe')}</p>
      </section>
    );
  }

  if (!recipe) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('recipeNotFound')}</h2>
        {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
        <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to="/recipes">
          {t('backToRecipes')}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      {showCreatedMessage && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('createSuccess')}
        </p>
      )}
      <h2 className="text-2xl font-semibold text-slate-900">{recipe.title}</h2>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      <p className="mt-3 text-sm text-slate-600">{recipe.description}</p>
      <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
        <span>{t('prepLabel')}: {recipe.prepMinutes} {t('minutesShort')}</span>
        <span>{t('servingsLabel')}: {recipe.servings}</span>
      </div>
      <Link className="mt-6 inline-flex text-sm text-slate-700 underline" to="/recipes">
        {t('backToRecipes')}
      </Link>
    </section>
  );
}
