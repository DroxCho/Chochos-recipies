import { RecipeList } from '../components/recipes/RecipeList';
import { canParticipate } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import { hasUserTriedRecipe } from '../lib/recipeTried';

export function TriedRecipesPage() {
  const { t } = useLanguage();
  const { role, userId } = useUserRole();
  const { recipes, isLoading, deletingRecipeId, error, deleteExistingRecipe } = useRecipes();
  const canUseTried = canParticipate(role);

  if (!canUseTried) {
    return (
      <section aria-label="tried-recipes-page" className="min-h-[320px]">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('triedRecipesTitle')}</h2>
        <p className="text-sm text-slate-500">{t('triedOnlyRegistered')}</p>
      </section>
    );
  }

  const triedRecipes = recipes.filter((recipe) => hasUserTriedRecipe(userId, recipe.id));

  return (
    <section aria-label="tried-recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('triedRecipesTitle')}</h2>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}
      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && triedRecipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noTriedRecipes')}</p>
      )}

      <RecipeList deletingRecipeId={deletingRecipeId} onDeleteRecipe={deleteExistingRecipe} recipes={triedRecipes} />
    </section>
  );
}
