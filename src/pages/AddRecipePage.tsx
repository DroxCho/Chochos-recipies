import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { canCreateRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { CreateRecipeInput } from '../types/recipe';

export function AddRecipePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role } = useUserRole();
  const { isCreating, error, createRecipe } = useRecipes();
  const [draftTitle, setDraftTitle] = useState('');

  if (!canCreateRecipe(role)) {
    return (
      <section aria-label="add-recipe-page" className="min-h-[320px] rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('addRecipe')}</h2>
        <p className="mt-3 text-sm text-amber-700">{t('noAddRecipePermission')}</p>
        <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to="/recipes">
          {t('backToRecipes')}
        </Link>
      </section>
    );
  }

  async function handleCreateRecipe(input: CreateRecipeInput) {
    const createdRecipe = await createRecipe(input);
    navigate(`/recipes/${createdRecipe.id}`, { state: { created: true } });
  }

  return (
    <section aria-label="add-recipe-page" className="min-h-[320px]">
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => navigate('/recipes')} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {draftTitle ? `${t('addRecipe')}: ${draftTitle}` : t('addRecipe')}
            </h2>
            <button
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
              onClick={() => navigate('/recipes')}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
          {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}
          <RecipeForm
            onCreate={handleCreateRecipe}
            isSubmitting={isCreating}
            multiStep
            onTitleChange={setDraftTitle}
          />
        </div>
      </div>
    </section>
  );
}
