import { Link, useNavigate, useParams } from 'react-router-dom';
import { canEditRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { updateRecipe } from '../data/recipes';
import { useRecipeDetails } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { CreateRecipeInput } from '../types/recipe';

export function EditRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role, userId } = useUserRole();
  const { recipe, isLoading, error } = useRecipeDetails(id);

  async function handleUpdate(input: CreateRecipeInput) {
    if (!recipe) {
      return;
    }

    const updatedRecipe = await updateRecipe({
      id: recipe.id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      complexity: input.complexity,
      ingredients: input.ingredients,
      steps: input.steps,
      photoUrls: input.photoUrls,
      ownerId: recipe.ownerId,
      ownerRole: recipe.ownerRole,
      status: recipe.status,
    });

    navigate(`/recipes/${updatedRecipe.id}`, { state: { updated: true } });
  }

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

  if (!canEditRecipe(role, recipe, userId)) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('editRecipe')}</h2>
        <p className="mt-2 text-sm text-amber-700">{t('noEditPermission')}</p>
        <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to={`/recipes/${recipe.id}`}>
          {t('viewDetails')}
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="edit-recipe-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('editRecipe')}</h2>
      <RecipeForm
        initialValues={recipe}
        isSubmitting={false}
        onCreate={handleUpdate}
        resetOnSuccess={false}
        submitLabelKey="saveRecipe"
      />
    </section>
  );
}
