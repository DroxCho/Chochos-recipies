import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (!recipe) {
      return;
    }

    setEditedTitle(recipe.title);
  }, [recipe]);

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
      dishType: input.dishType,
      cuisine: input.cuisine,
      mainProduct: input.mainProduct,
      mainProducts: input.mainProducts,
      ingredients: input.ingredients,
      steps: input.steps,
      notes: input.notes,
      photoUrls: input.photoUrls,
      photoOriginalUrl: input.photoOriginalUrl,
      ownerId: recipe.ownerId,
      ownerRole: recipe.ownerRole,
      status: role === 'registered' ? 'pending' : recipe.status,
      reviewComment: undefined,
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
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => navigate(`/recipes/${recipe.id}`)} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {editedTitle ? `${t('editRecipe')}: ${editedTitle}` : t('editRecipe')}
            </h2>
            <button
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
              type="button"
            >
              Х
            </button>
          </div>
          <RecipeForm
            initialValues={recipe}
            isSubmitting={false}
            onCreate={handleUpdate}
            resetOnSuccess={false}
            submitLabelKey="saveRecipe"
            submitErrorKey="errorUpdateRecipe"
            multiStep
            onTitleChange={setEditedTitle}
          />
        </div>
      </div>
    </section>
  );
}
