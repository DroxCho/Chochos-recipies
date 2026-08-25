import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { canApproveRecipe, canEditRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { updateRecipe } from '../data/recipes';
import { useRecipeDetails } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import { useLanguage } from '../i18n/useLanguage';
import type { Recipe } from '../types/recipe';

interface RecipeDetailsLocationState {
  created?: boolean;
  updated?: boolean;
}

export function RecipeDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { role, userId } = useUserRole();
  const { recipe, isLoading, error } = useRecipeDetails(id);
  const [approvalOverride, setApprovalOverride] = useState<Recipe | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const locationState = location.state as RecipeDetailsLocationState | null;
  const showCreatedMessage = Boolean(locationState?.created);
  const showUpdatedMessage = Boolean(locationState?.updated);

  const currentRecipe = approvalOverride && approvalOverride.id === recipe?.id ? approvalOverride : recipe;

  async function handleApprove() {
    if (!currentRecipe || !canApproveRecipe(role)) {
      return;
    }

    setIsApproving(true);
    setApprovalError(null);

    try {
      const updatedRecipe = await updateRecipe({
        id: currentRecipe.id,
        title: currentRecipe.title,
        description: currentRecipe.description,
        prepMinutes: currentRecipe.prepMinutes,
        servings: currentRecipe.servings,
        complexity: currentRecipe.complexity,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        photoUrls: currentRecipe.photoUrls,
        ownerId: currentRecipe.ownerId,
        ownerRole: currentRecipe.ownerRole,
        status: 'approved',
      });

      setApprovalOverride(updatedRecipe);
    } catch {
      setApprovalError(t('errorCreateRecipe'));
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">{t('loadingRecipe')}</p>
      </section>
    );
  }

  if (!currentRecipe) {
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

  const localizedRecipe = getLocalizedRecipe(currentRecipe, language);
  const canEditCurrentRecipe = canEditRecipe(role, currentRecipe, userId);
  const canApproveCurrentRecipe = canApproveRecipe(role) && currentRecipe.status === 'pending';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      {showCreatedMessage && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('createSuccess')}
        </p>
      )}
      {showUpdatedMessage && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('updatedSuccess')}
        </p>
      )}
      <h2 className="text-2xl font-semibold text-slate-900">{localizedRecipe.title}</h2>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      {approvalError && <p className="mt-2 text-sm text-amber-700">{approvalError}</p>}
      <p className="mt-3 text-sm text-slate-600">{localizedRecipe.description}</p>
      <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {currentRecipe.status === 'pending' ? t('pendingStatus') : t('approvedStatus')}
      </p>
      <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
        <span>{t('prepLabel')}: {currentRecipe.prepMinutes} {t('minutesShort')}</span>
        <span>{t('servingsLabel')}: {currentRecipe.servings}</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {canEditCurrentRecipe && (
          <Link className="inline-flex text-sm text-slate-700 underline" to={`/recipes/${currentRecipe.id}/edit`}>
            {t('editRecipe')}
          </Link>
        )}
        {canApproveCurrentRecipe && (
          <button
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={isApproving}
            onClick={handleApprove}
            type="button"
          >
            {t('approveRecipe')}
          </button>
        )}
      </div>
      <Link className="mt-6 inline-flex text-sm text-slate-700 underline" to="/recipes">
        {t('backToRecipes')}
      </Link>
    </section>
  );
}
