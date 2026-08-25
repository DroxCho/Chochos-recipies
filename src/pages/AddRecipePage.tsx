import { useNavigate } from 'react-router-dom';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { CreateRecipeInput } from '../types/recipe';

export function AddRecipePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isCreating, error, createRecipe } = useRecipes();

  async function handleCreateRecipe(input: CreateRecipeInput) {
    const createdRecipe = await createRecipe(input);
    navigate(`/recipes/${createdRecipe.id}`, { state: { created: true } });
  }

  return (
    <section aria-label="add-recipe-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('addRecipe')}</h2>
      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}
      <RecipeForm onCreate={handleCreateRecipe} isSubmitting={isCreating} />
    </section>
  );
}
