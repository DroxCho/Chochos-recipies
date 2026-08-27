import { RecipeList } from '../components/recipes/RecipeList';
import { canViewFavorites } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import { hasUserFavoritedRecipe } from '../lib/recipeFavorites';

export function FavoritesPage() {
  const { t } = useLanguage();
  const { role, userId } = useUserRole();
  const { recipes, isLoading, deletingRecipeId, error, deleteExistingRecipe } = useRecipes();
  const canUseFavorites = canViewFavorites(role);

  if (!canUseFavorites) {
    return (
      <section aria-label="favorites-page" className="min-h-[320px]">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('favoritesTitle')}</h2>
        <p className="text-sm text-slate-500">{t('favoritesOnlyRegistered')}</p>
      </section>
    );
  }

  const favoriteRecipes = recipes.filter((recipe) => hasUserFavoritedRecipe(userId, recipe.id));

  return (
    <section aria-label="favorites-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('favoritesTitle')}</h2>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}
      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && favoriteRecipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noFavoriteRecipes')}</p>
      )}

      <RecipeList deletingRecipeId={deletingRecipeId} onDeleteRecipe={deleteExistingRecipe} recipes={favoriteRecipes} />
    </section>
  );
}
