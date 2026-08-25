import { useNavigate } from 'react-router-dom';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { CreateRecipeInput } from '../types/recipe';

export function RecipesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { recipes, isLoading, isCreating, error, createRecipe } = useRecipes();

  async function handleCreateRecipe(input: CreateRecipeInput) {
    const createdRecipe = await createRecipe(input);
    navigate(`/recipes/${createdRecipe.id}`, { state: { created: true } });
  }

  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('recipesTitle')}</h2>

      <RecipeForm onCreate={handleCreateRecipe} isSubmitting={isCreating} />

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && recipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noRecipes')}</p>
      )}

      <RecipeList recipes={recipes} />
    </section>
  );
}
