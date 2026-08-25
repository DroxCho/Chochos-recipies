import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { canApproveRecipe, canEditRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { updateRecipe } from '../data/recipes';
import { useRecipeDetails } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import { useLanguage } from '../i18n/useLanguage';
import { addUserMessage } from '../lib/userMessages';
import type { Recipe } from '../types/recipe';

interface RecipeDetailsLocationState {
  created?: boolean;
  updated?: boolean;
}

function complexityToStars(complexity?: Recipe['complexity']): number {
  if (complexity === 'easy') {
    return 2;
  }

  if (complexity === 'medium') {
    return 3;
  }

  if (complexity === 'hard') {
    return 5;
  }

  return 0;
}

export function RecipeDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { role, userId } = useUserRole();
  const { recipe, isLoading, error } = useRecipeDetails(id);
  const [approvalOverride, setApprovalOverride] = useState<Recipe | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
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
    setReviewSuccess(null);

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
        reviewComment: undefined,
        metaOnly: true,
      });

      setApprovalOverride(updatedRecipe);
      setReviewSuccess(t('reviewActionSuccess'));
    } catch {
      setApprovalError(t('errorUpdateRecipe'));
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!currentRecipe || !canApproveRecipe(role)) {
      return;
    }

    setIsRejecting(true);
    setApprovalError(null);
    setReviewSuccess(null);

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
        status: 'rejected',
        reviewComment: undefined,
        metaOnly: true,
      });

      setApprovalOverride(updatedRecipe);
      setReviewSuccess(t('reviewActionSuccess'));
    } catch {
      setApprovalError(t('errorUpdateRecipe'));
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleReturnWithComment() {
    if (!currentRecipe || !canApproveRecipe(role)) {
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setApprovalError(t('reviewCommentRequired'));
      return;
    }

    setIsReturning(true);
    setApprovalError(null);
    setReviewSuccess(null);

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
        status: 'changes_requested',
        reviewComment: trimmedComment,
        metaOnly: true,
      });

      addUserMessage(
        currentRecipe.ownerId,
        currentRecipe.id,
        `Рецептата "${currentRecipe.title}" е върната за редакция. Коментар: ${trimmedComment}`,
      );

      setApprovalOverride(updatedRecipe);
      setReviewComment('');
      setShowReturnDialog(false);
      setReviewSuccess(t('reviewActionSuccess'));
    } catch {
      setApprovalError(t('errorUpdateRecipe'));
    } finally {
      setIsReturning(false);
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
  const statusLabel =
    currentRecipe.status === 'pending'
      ? t('pendingStatus')
      : currentRecipe.status === 'rejected'
      ? t('rejectedStatus')
      : currentRecipe.status === 'changes_requested'
      ? t('changesRequestedStatus')
      : t('approvedStatus');
  const complexityStars = complexityToStars(currentRecipe.complexity);
  const recipeIngredients = currentRecipe.ingredients?.map((item) => item.trim()).filter(Boolean) ?? [];
  const recipeSteps = currentRecipe.steps?.map((item) => item.trim()).filter(Boolean) ?? [];
  const recipePhotos = currentRecipe.photoUrls?.map((url) => url.trim()).filter(Boolean) ?? [];

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
      {reviewSuccess && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{reviewSuccess}</p>
      )}
      <h2 className="text-2xl font-semibold text-slate-900">{localizedRecipe.title}</h2>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      {approvalError && <p className="mt-2 text-sm text-amber-700">{approvalError}</p>}
      <p className="mt-3 text-sm text-slate-600">{localizedRecipe.description}</p>
      <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {statusLabel}
      </p>
      {complexityStars > 0 && (
        <p className="mt-3 text-sm text-amber-500" aria-label={`${t('complexity')} ${complexityStars}`}>
          {'★'.repeat(complexityStars)}
          <span className="ml-1 text-slate-500">({complexityStars}/5)</span>
        </p>
      )}
      {currentRecipe.reviewComment && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{currentRecipe.reviewComment}</p>
      )}
      {recipePhotos.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipePhotos.map((photoUrl, index) => (
            <img
              key={`${currentRecipe.id}-photo-${index}`}
              alt={`${localizedRecipe.title} ${index + 1}`}
              className="h-40 w-full rounded-lg border border-slate-200 object-cover"
              loading="lazy"
              src={photoUrl}
            />
          ))}
        </div>
      )}
      {recipePhotos.length === 0 && (
        <div className="mt-4 flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          {t('noPhotoPlaceholder')}
        </div>
      )}
      <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
        <span>{t('prepLabel')}: {currentRecipe.prepMinutes} {t('minutesShort')}</span>
        <span>{t('servingsLabel')}: {currentRecipe.servings}</span>
      </div>
      {recipeIngredients.length > 0 && (
        <section className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">{t('ingredients')}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {recipeIngredients.map((ingredient, index) => (
              <li key={`${currentRecipe.id}-ingredient-${index}`}>{ingredient}</li>
            ))}
          </ul>
        </section>
      )}
      {recipeSteps.length > 0 && (
        <section className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">{t('steps')}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {recipeSteps.map((step, index) => (
              <li key={`${currentRecipe.id}-step-${index}`}>{step}</li>
            ))}
          </ol>
        </section>
      )}
      <div className="mt-4 flex items-center gap-3">
        {canEditCurrentRecipe && (
          <Link className="inline-flex text-sm text-slate-700 underline" to={`/recipes/${currentRecipe.id}/edit`}>
            {t('editRecipe')}
          </Link>
        )}
        {canApproveCurrentRecipe && (
          <>
            <button
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={isApproving || isRejecting || isReturning}
              onClick={handleApprove}
              type="button"
            >
              {t('approveRecipe')}
            </button>
            <button
              className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={isApproving || isRejecting || isReturning}
              onClick={handleReject}
              type="button"
            >
              {t('rejectRecipe')}
            </button>
            <button
              className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={isApproving || isRejecting || isReturning}
              onClick={() => setShowReturnDialog(true)}
              type="button"
            >
              {t('returnForEdit')}
            </button>
          </>
        )}
      </div>
      {showReturnDialog && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            {t('reviewCommentLabel')}
            <textarea
              className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder={t('reviewCommentPlaceholder')}
              value={reviewComment}
            />
          </label>
          <div className="mt-3 flex items-center gap-2">
            <button
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={isReturning}
              onClick={handleReturnWithComment}
              type="button"
            >
              {t('sendReviewComment')}
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
              onClick={() => {
                setShowReturnDialog(false);
                setReviewComment('');
              }}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      <Link className="mt-6 inline-flex text-sm text-slate-700 underline" to="/recipes">
        {t('backToRecipes')}
      </Link>
    </section>
  );
}
