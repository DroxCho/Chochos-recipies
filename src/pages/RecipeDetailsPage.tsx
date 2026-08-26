import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { canApproveRecipe, canEditRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { deleteRecipeById, updateRecipe } from '../data/recipes';
import { useRecipeDetails } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import type { TranslationKey } from '../i18n/translations';
import { useLanguage } from '../i18n/useLanguage';
import { addRecipeComment, deleteRecipeComment, getRecipeComments, type RecipeComment, updateRecipeComment } from '../lib/recipeComments';
import { hasUserFavoritedRecipe, setUserRecipeFavorite } from '../lib/recipeFavorites';
import { getMainProductMeta, getMainProductsMeta } from '../lib/mainProduct';
import { getRecipeAverageRating, getUserRecipeRating, setUserRecipeRating } from '../lib/recipeRatings';
import { hasUserTriedRecipe, setUserTriedRecipe } from '../lib/recipeTried';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { role, userId } = useUserRole();
  const canUseTried = role === 'registered' || role === 'admin';
  const canUseSocialRating = role === 'registered' || role === 'admin';
  const canMessageCreator = role === 'registered' || role === 'admin';
  const canWriteComments = role === 'registered' || role === 'admin';
  const canReportComments = role === 'registered';
  const { recipe, isLoading, error } = useRecipeDetails(id);
  const [approvalOverride, setApprovalOverride] = useState<Recipe | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingAuthorMessage, setIsSendingAuthorMessage] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showAuthorMessageDialog, setShowAuthorMessageDialog] = useState(false);
  const [isPreparationWizardOpen, setIsPreparationWizardOpen] = useState(false);
  const [preparationStep, setPreparationStep] = useState(1);
  const [preparedIngredients, setPreparedIngredients] = useState<Record<number, boolean>>({});
  const [preparedSteps, setPreparedSteps] = useState<Record<number, boolean>>({});
  const [isRecipeTried, setIsRecipeTried] = useState(false);
  const [isRecipeFavorite, setIsRecipeFavorite] = useState(false);
  const [userRecipeRating, setUserRecipeRatingState] = useState<number>(0);
  const [recipeRatingAverage, setRecipeRatingAverage] = useState<number>(0);
  const [recipeRatingCount, setRecipeRatingCount] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');
  const [authorMessage, setAuthorMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportDescription, setReportDescription] = useState('');
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
        dishType: currentRecipe.dishType,
        cuisine: currentRecipe.cuisine,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        notes: currentRecipe.notes,
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
        dishType: currentRecipe.dishType,
        cuisine: currentRecipe.cuisine,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        notes: currentRecipe.notes,
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
        dishType: currentRecipe.dishType,
        cuisine: currentRecipe.cuisine,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        notes: currentRecipe.notes,
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

  async function handleUnpublish() {
    if (!currentRecipe || role !== 'admin') {
      return;
    }

    setIsUnpublishing(true);
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
        dishType: currentRecipe.dishType,
        cuisine: currentRecipe.cuisine,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        notes: currentRecipe.notes,
        photoUrls: currentRecipe.photoUrls,
        ownerId: currentRecipe.ownerId,
        ownerRole: currentRecipe.ownerRole,
        status: 'pending',
        reviewComment: undefined,
        metaOnly: true,
      });

      setApprovalOverride(updatedRecipe);
      setReviewSuccess(t('reviewActionSuccess'));
    } catch {
      setApprovalError(t('errorUpdateRecipe'));
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function handleDelete() {
    if (!currentRecipe || role !== 'admin') {
      return;
    }

    if (!window.confirm(t('deleteRecipeConfirm'))) {
      return;
    }

    setIsDeleting(true);
    setApprovalError(null);
    setReviewSuccess(null);

    try {
      await deleteRecipeById(currentRecipe.id);
      navigate('/recipes', { state: { deleted: true } });
    } catch {
      setApprovalError(t('errorUpdateRecipe'));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSendAuthorMessage() {
    if (!currentRecipe || !canMessageCreator || !userId) {
      return;
    }

    const trimmedMessage = authorMessage.trim();
    if (!trimmedMessage) {
      setApprovalError(t('authorMessageRequired'));
      return;
    }

    setIsSendingAuthorMessage(true);
    setApprovalError(null);
    setReviewSuccess(null);

    try {
      addUserMessage(currentRecipe.ownerId, currentRecipe.id, trimmedMessage);
      setAuthorMessage('');
      setShowAuthorMessageDialog(false);
      setReviewSuccess(t('authorMessageSent'));
    } finally {
      setIsSendingAuthorMessage(false);
    }
  }

  function handlePostComment() {
    if (!currentRecipe || !canWriteComments || !userId) {
      return;
    }

    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      setApprovalError(t('commentRequired'));
      return;
    }

    setApprovalError(null);
    addRecipeComment(userId, currentRecipe.id, trimmedComment);
    setCommentText('');
    setReviewSuccess(t('commentSent'));
    setComments(getRecipeComments(currentRecipe.id));
  }

  function handleStartEditComment(comment: RecipeComment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setApprovalError(null);
  }

  function handleSaveCommentEdit() {
    if (!currentRecipe || !userId || !editingCommentId) {
      return;
    }

    if (!editingCommentText.trim()) {
      setApprovalError(t('commentRequired'));
      return;
    }

    const updated = updateRecipeComment(editingCommentId, userId, editingCommentText);
    if (!updated) {
      return;
    }

    setComments(getRecipeComments(currentRecipe.id));
    setEditingCommentId(null);
    setEditingCommentText('');
    setReviewSuccess(t('commentUpdated'));
    setApprovalError(null);
  }

  function handleDeleteComment(comment: RecipeComment) {
    if (!currentRecipe || !userId) {
      return;
    }

    if (!window.confirm(t('deleteCommentConfirm'))) {
      return;
    }

    const deleted = deleteRecipeComment(comment.id, userId);
    if (!deleted) {
      return;
    }

    setComments(getRecipeComments(currentRecipe.id));
    if (editingCommentId === comment.id) {
      setEditingCommentId(null);
      setEditingCommentText('');
    }
    setReviewSuccess(t('commentDeleted'));
    setApprovalError(null);
  }

  function handleSendCommentReport(comment: RecipeComment) {
    if (!currentRecipe || !userId || !canReportComments) {
      return;
    }

    const trimmedDescription = reportDescription.trim();
    if (!trimmedDescription) {
      setApprovalError(t('reportRequired'));
      return;
    }

    const reportText = [
      `Доклад за коментар в рецептата "${currentRecipe.title}"`,
      `Коментар: "${comment.text}"`,
      `Описание: ${trimmedDescription}`,
      `Подател: ${userId}`,
    ].join('\n');

    addUserMessage('admin-user-1', currentRecipe.id, reportText);
    setReportingCommentId(null);
    setReportDescription('');
    setReviewSuccess(t('reportSent'));
    setApprovalError(null);
  }

  function openPreparationWizard() {
    setPreparationStep(1);
    setPreparedIngredients({});
    setPreparedSteps({});
    setIsPreparationWizardOpen(true);
  }

  function closePreparationWizard() {
    setIsPreparationWizardOpen(false);
  }

  function togglePreparedIngredient(index: number) {
    setPreparedIngredients((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

  function togglePreparedStep(index: number) {
    setPreparedSteps((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

  function handleToggleRecipeTried() {
    if (!currentRecipe || !canUseTried) {
      return;
    }

    const nextValue = !isRecipeTried;
    setIsRecipeTried(nextValue);
    setUserTriedRecipe(userId, currentRecipe.id, nextValue);
  }

  function handleToggleRecipeFavorite() {
    if (!currentRecipe || !canUseSocialRating) {
      return;
    }

    const nextValue = !isRecipeFavorite;
    setIsRecipeFavorite(nextValue);
    setUserRecipeFavorite(userId, currentRecipe.id, nextValue);
  }

  function refreshRecipeRating(recipeId: string) {
    const { average, count } = getRecipeAverageRating(recipeId);
    setRecipeRatingAverage(average);
    setRecipeRatingCount(count);
  }

  function handleRateRecipe(rating: number) {
    if (!currentRecipe || !canUseSocialRating) {
      return;
    }

    setUserRecipeRating(userId, currentRecipe.id, rating);
    setUserRecipeRatingState(rating);
    refreshRecipeRating(currentRecipe.id);
  }

  useEffect(() => {
    if (!currentRecipe || !canUseTried) {
      setIsRecipeTried(false);
      return;
    }

    setIsRecipeTried(hasUserTriedRecipe(userId, currentRecipe.id));
  }, [canUseTried, currentRecipe, userId]);

  useEffect(() => {
    if (!currentRecipe || !canUseSocialRating) {
      setIsRecipeFavorite(false);
      return;
    }

    setIsRecipeFavorite(hasUserFavoritedRecipe(userId, currentRecipe.id));
  }, [canUseSocialRating, currentRecipe, userId]);

  useEffect(() => {
    if (!currentRecipe) {
      setUserRecipeRatingState(0);
      setRecipeRatingAverage(0);
      setRecipeRatingCount(0);
      return;
    }

    const ownRating = getUserRecipeRating(userId, currentRecipe.id);
    setUserRecipeRatingState(ownRating ?? 0);
    refreshRecipeRating(currentRecipe.id);
  }, [currentRecipe, userId]);

  useEffect(() => {
    if (!currentRecipe) {
      setComments([]);
      return;
    }

    setComments(getRecipeComments(currentRecipe.id));
  }, [currentRecipe]);

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
  const canSeeStatus = role === 'admin' || currentRecipe.ownerId === userId;
  const activeDishType = new URLSearchParams(location.search).get('dishType');
  const activeCuisine = new URLSearchParams(location.search).get('cuisine');
  const isDishTypeActive = activeDishType === (currentRecipe.dishType ?? 'main');
  const isCuisineActive = activeCuisine === (currentRecipe.cuisine ?? 'international');
  const statusLabel =
    currentRecipe.status === 'pending'
      ? t('pendingStatus')
      : currentRecipe.status === 'rejected'
      ? t('rejectedStatus')
      : currentRecipe.status === 'changes_requested'
      ? t('changesRequestedStatus')
      : t('approvedStatus');
  const complexityStars = complexityToStars(currentRecipe.complexity);
  const dishTypeLabelKey: TranslationKey =
    currentRecipe.dishType === 'dessert'
      ? 'dishTypeDessert'
      : currentRecipe.dishType === 'soup'
      ? 'dishTypeSoup'
      : currentRecipe.dishType === 'salad'
      ? 'dishTypeSalad'
      : currentRecipe.dishType === 'appetizer'
      ? 'dishTypeAppetizer'
      : currentRecipe.dishType === 'breakfast'
      ? 'dishTypeBreakfast'
      : 'dishTypeMain';

  const cuisineLabelKey: TranslationKey =
    currentRecipe.cuisine === 'bulgarian'
      ? 'cuisineBulgarian'
      : currentRecipe.cuisine === 'french'
      ? 'cuisineFrench'
      : currentRecipe.cuisine === 'asian'
      ? 'cuisineAsian'
      : currentRecipe.cuisine === 'italian'
      ? 'cuisineItalian'
      : currentRecipe.cuisine === 'mexican'
      ? 'cuisineMexican'
      : currentRecipe.cuisine === 'spanish'
      ? 'cuisineSpanish'
      : currentRecipe.cuisine === 'turkish'
      ? 'cuisineTurkish'
      : currentRecipe.cuisine === 'vegan'
      ? 'cuisineVegan'
      : currentRecipe.cuisine === 'vegetarian'
      ? 'cuisineVegetarian'
      : 'cuisineInternational';
  const recipeIngredients = currentRecipe.ingredients?.map((item) => item.trim()).filter(Boolean) ?? [];
  const recipeSteps = currentRecipe.steps?.map((item) => item.trim()).filter(Boolean) ?? [];
  const recipeNotes = currentRecipe.notes?.trim() ?? '';
  const recipePhotos = currentRecipe.photoUrls?.map((url) => url.trim()).filter(Boolean) ?? [];
  const recipesListPath = `/recipes${location.search ? location.search : ''}`;
  const preparationTotalSteps = 4;
  const preparationProgressPercent = ((preparationStep - 1) / (preparationTotalSteps - 1)) * 100;
  const preparationStepLabels: TranslationKey[] = [
    'ingredients',
    'steps',
    'additionalNotes',
    'prepWizardSuccessTitle',
  ];
  const roundedAverageRating = Math.round((recipeRatingAverage || 0) * 2) / 2;
  const mainProductMetas = currentRecipe?.mainProducts?.length
    ? getMainProductsMeta(currentRecipe.mainProducts, language)
    : (() => {
        const fallback = getMainProductMeta(currentRecipe?.mainProduct, language);
        return fallback
          ? [{ key: currentRecipe?.mainProduct ?? 'fallback-main-product', icon: fallback.icon, iconType: fallback.iconType, label: fallback.label }]
          : [];
      })();

  function navigateWithMergedFilters(nextDishType?: string, nextCuisine?: string) {
    const nextParams = new URLSearchParams(location.search);

    if (nextDishType) {
      if (nextParams.get('dishType') === nextDishType) {
        nextParams.delete('dishType');
      } else {
        nextParams.set('dishType', nextDishType);
      }
    }

    if (nextCuisine) {
      if (nextParams.get('cuisine') === nextCuisine) {
        nextParams.delete('cuisine');
      } else {
        nextParams.set('cuisine', nextCuisine);
      }
    }

    const query = nextParams.toString();
    navigate(`/recipes${query ? `?${query}` : ''}`);
  }

  return (
    <section aria-label="recipe-details-page" className="min-h-[320px]">
      <div className="fixed inset-0 z-40 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => navigate(recipesListPath)}>
        <div
          className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{localizedRecipe.title}</h2>
            <button
              aria-label={t('cancel')}
              className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-base font-semibold leading-none text-slate-700"
              onClick={() => navigate(recipesListPath)}
              data-tooltip={t('cancel')}
              type="button"
            >
              x
            </button>
          </div>
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
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      {approvalError && <p className="mt-2 text-sm text-amber-700">{approvalError}</p>}
      <p className="mt-3 text-sm text-slate-600">{localizedRecipe.description}</p>
      {canSeeStatus && (
        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {statusLabel}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isDishTypeActive ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
          }`}
          onClick={() => navigateWithMergedFilters(currentRecipe.dishType ?? 'main')}
          type="button"
        >
          {t(dishTypeLabelKey)}
        </button>
        <button
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isCuisineActive ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700'
          }`}
          onClick={() => navigateWithMergedFilters(undefined, currentRecipe.cuisine ?? 'international')}
          type="button"
        >
          {t(cuisineLabelKey)}
        </button>
      </div>
      {currentRecipe.reviewComment && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{currentRecipe.reviewComment}</p>
      )}
      {recipePhotos.length > 0 && (
        <div className="mt-5 grid gap-5">
          {recipePhotos.map((photoUrl, index) => (
            <div key={`${currentRecipe.id}-photo-${index}`} className="relative mx-auto w-full max-w-2xl">
              <img
                alt={`${localizedRecipe.title} ${index + 1}`}
                className="aspect-square w-full rounded-xl border border-slate-200 object-cover shadow-sm"
                loading="lazy"
                src={photoUrl}
              />
              {(mainProductMetas.length > 0 || canUseSocialRating || (isRecipeTried && canUseTried)) && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  {mainProductMetas.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {mainProductMetas.map((item) => (
                        <span
                          key={`main-product-icon-${item.key}`}
                          aria-label={`${t('mainIngredient')}: ${item.label}`}
                          className="instant-tooltip inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl text-slate-900 shadow-md"
                          data-tooltip={`${t('mainIngredient')}: ${item.label}`}
                          style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                        >
                          {item.icon}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                  {isRecipeTried && canUseTried && (
                    <span
                      aria-label={t('triedRecipe')}
                      className="instant-tooltip inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-700 bg-emerald-600 text-2xl font-black text-white shadow-md"
                      data-tooltip={t('triedRecipe')}
                    >
                      ✓
                    </span>
                  )}
                  {canUseSocialRating && (
                    <button
                      aria-label={t('favoriteRecipe')}
                      className={`instant-tooltip inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-2xl leading-none shadow-md transition-colors ${
                        isRecipeFavorite
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-slate-300 bg-white/90 text-slate-400 hover:bg-slate-50'
                      }`}
                      onClick={handleToggleRecipeFavorite}
                      data-tooltip={t('favoriteRecipe')}
                      type="button"
                    >
                      {'\u2665'}
                    </button>
                  )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {recipePhotos.length === 0 && (
        <div className="mt-4">
          <div className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            {t('noPhotoPlaceholder')}
          </div>
          {(mainProductMetas.length > 0 || canUseSocialRating || (isRecipeTried && canUseTried)) && (
            <div className="mt-2 flex items-center justify-between gap-2">
              {mainProductMetas.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {mainProductMetas.map((item) => (
                    <span
                      key={`main-product-empty-icon-${item.key}`}
                      aria-label={`${t('mainIngredient')}: ${item.label}`}
                      className="instant-tooltip inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl text-slate-900 shadow-md"
                      data-tooltip={`${t('mainIngredient')}: ${item.label}`}
                      style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                    >
                      {item.icon}
                    </span>
                  ))}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
              {isRecipeTried && canUseTried && (
                <span
                  aria-label={t('triedRecipe')}
                  className="instant-tooltip inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-700 bg-emerald-600 text-xl font-black text-white shadow-md"
                  data-tooltip={t('triedRecipe')}
                >
                  ✓
                </span>
              )}
              {canUseSocialRating && (
                <button
                  aria-label={t('favoriteRecipe')}
                  className={`instant-tooltip inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl leading-none shadow-md transition-colors ${
                    isRecipeFavorite
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-slate-300 bg-white/95 text-slate-400 hover:bg-slate-50'
                  }`}
                  onClick={handleToggleRecipeFavorite}
                  data-tooltip={t('favoriteRecipe')}
                  type="button"
                >
                  {'\u2665'}
                </button>
              )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span>{t('prepLabel')}: {currentRecipe.prepMinutes} {t('minutesShort')}</span>
        <span>{t('servingsLabel')}: {currentRecipe.servings}</span>
        {complexityStars > 0 && (
          <span className="instant-tooltip inline-flex items-center gap-1" aria-label={`${t('complexity')} ${complexityStars}`} data-tooltip={`${t('complexity')} ${complexityStars}/5`}>
            <span className="text-slate-600">{t('complexity')}:</span>
            <span className="text-amber-500">{'★'.repeat(complexityStars)}</span>
            <span className="text-slate-500">({complexityStars}/5)</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-slate-600">
          {t('ratingLabel')}:
          <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => {
              const fillPercent =
                roundedAverageRating >= value ? 100 : roundedAverageRating === value - 0.5 ? 50 : 0;

              return (
                <span
                  key={`recipe-rating-${value}`}
                  aria-label={`${t('ratingLabel')} ${value}`}
                  className="instant-tooltip relative inline-flex text-base leading-none"
                  data-tooltip={`${t('ratingLabel')} ${value}`}
                >
                  <span className="text-slate-300">★</span>
                  {fillPercent > 0 && (
                    <span className="absolute left-0 top-0 overflow-hidden text-sky-500" style={{ width: `${fillPercent}%` }}>
                      ★
                    </span>
                  )}
                </span>
              );
            })}
          </span>
          {recipeRatingCount > 0 ? (
            <span className="text-slate-500">({recipeRatingAverage.toFixed(1)}/5, {recipeRatingCount})</span>
          ) : (
            <span className="text-slate-500">({t('ratingNoVotes')})</span>
          )}
        </span>
        {canUseSocialRating && (
          <span className="inline-flex items-center gap-1 text-slate-600">
            {t('myRatingLabel')}:
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => {
                const highlighted = value <= userRecipeRating;

                return (
                  <button
                    key={`recipe-my-rating-${value}`}
                    aria-label={`${t('myRatingLabel')} ${value}`}
                    className={`instant-tooltip cursor-pointer text-base leading-none ${highlighted ? 'text-emerald-500' : 'text-slate-300'}`}
                    onClick={() => handleRateRecipe(value)}
                    data-tooltip={`${t('myRatingLabel')} ${value}`}
                    type="button"
                  >
                    ★
                  </button>
                );
              })}
            </span>
          </span>
        )}
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
      {recipeNotes.length > 0 && (
        <section className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">{t('additionalNotes')}</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{recipeNotes}</p>
        </section>
      )}
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{t('userActionsSection')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              onClick={openPreparationWizard}
              type="button"
            >
              {t('prepWizardStart')}
            </button>
            {canUseTried && (
              <button
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isRecipeTried
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
                onClick={handleToggleRecipeTried}
                type="button"
              >
                {t('triedRecipe')}
              </button>
            )}
            {canMessageCreator && (
              <button
                className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                disabled={isSendingAuthorMessage}
                onClick={() => setShowAuthorMessageDialog(true)}
                type="button"
              >
                {t('messageRecipeCreator')}
              </button>
            )}
          </div>
        </div>

        {role === 'admin' && (
          <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">{t('adminActionsSection')}</p>
            <div className="flex flex-wrap items-center gap-3">
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
                    disabled={isApproving || isRejecting || isReturning || isUnpublishing || isDeleting}
                    onClick={() => setShowReturnDialog(true)}
                    type="button"
                  >
                    {t('returnForEdit')}
                  </button>
                </>
              )}
              <button
                className="inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                disabled={isApproving || isRejecting || isReturning || isUnpublishing || isDeleting || currentRecipe.status === 'pending'}
                onClick={handleUnpublish}
                type="button"
              >
                {t('unpublishRecipe')}
              </button>
              <button
                className="inline-flex items-center rounded-md bg-rose-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                disabled={isApproving || isRejecting || isReturning || isUnpublishing || isDeleting}
                onClick={handleDelete}
                type="button"
              >
                {t('deleteRecipe')}
              </button>
            </div>
          </div>
        )}
      </div>
      {canEditCurrentRecipe && (
        <div className="mt-3 flex items-center gap-3">
          <Link
            className="inline-flex items-center rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            to={`/recipes/${currentRecipe.id}/edit`}
          >
            {t('editRecipe')}
          </Link>
        </div>
      )}
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
      {canMessageCreator && showAuthorMessageDialog && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            {t('messageAuthorLabel')}
            <textarea
              className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => setAuthorMessage(event.target.value)}
              placeholder={t('messageAuthorPlaceholder')}
              value={authorMessage}
            />
          </label>
          <div className="mt-3 flex items-center gap-2">
            <button
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSendingAuthorMessage}
              onClick={handleSendAuthorMessage}
              type="button"
            >
              {t('sendAuthorMessage')}
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
              onClick={() => {
                setShowAuthorMessageDialog(false);
                setAuthorMessage('');
              }}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{t('commentsTitle')}</h3>
        <div className="mt-3 space-y-2">
          {comments.length === 0 && <p className="text-sm text-slate-500">{t('noComments')}</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {comment.userId === userId ? t('currentUserLabel') : comment.userId} · {new Date(comment.createdAt).toLocaleString()}
                </p>
                {canReportComments && (
                  <div className="group relative inline-flex">
                    <button
                      aria-label={t('reportToAdmin')}
                      className="inline-flex h-5 w-5 items-center justify-center bg-red-600 text-xs font-black leading-none text-white [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
                      onClick={() => {
                        setReportingCommentId(comment.id);
                        setReportDescription('');
                        setApprovalError(null);
                      }}
                      type="button"
                    >
                      !
                    </button>
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-within:opacity-100">
                      {t('reportToAdmin')}
                    </span>
                  </div>
                )}
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    onChange={(event) => setEditingCommentText(event.target.value)}
                    value={editingCommentText}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white"
                      onClick={handleSaveCommentEdit}
                      type="button"
                    >
                      {t('saveComment')}
                    </button>
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingCommentText('');
                      }}
                      type="button"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{comment.text}</p>
                  {comment.userId === userId && canWriteComments && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                        onClick={() => handleStartEditComment(comment)}
                        type="button"
                      >
                        {t('editComment')}
                      </button>
                      <button
                        className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs text-rose-700"
                        onClick={() => handleDeleteComment(comment)}
                        type="button"
                      >
                        {t('deleteComment')}
                      </button>
                    </div>
                  )}
                </>
              )}
              {reportingCommentId === comment.id && canReportComments && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    onChange={(event) => setReportDescription(event.target.value)}
                    placeholder={t('reportDescriptionPlaceholder')}
                    value={reportDescription}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                      onClick={() => handleSendCommentReport(comment)}
                      type="button"
                    >
                      {t('sendReport')}
                    </button>
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                      onClick={() => {
                        setReportingCommentId(null);
                        setReportDescription('');
                      }}
                      type="button"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {canWriteComments ? (
          <div className="mt-3">
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={t('commentsPlaceholder')}
              value={commentText}
            />
            <div className="mt-2">
              <button
                className="rounded-md bg-sky-400 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
                onClick={handlePostComment}
                type="button"
              >
                {t('sendComment')}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t('commentsOnlyRegistered')}</p>
        )}
      </div>
      <Link
        className="mt-6 inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
        to={recipesListPath}
      >
        {t('backToRecipes')}
      </Link>

      {isPreparationWizardOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{t('prepWizardCookingPrefix')} {localizedRecipe.title}</h3>
                <p className="text-xs text-slate-500">{t('wizardStepLabel')} {preparationStep}/{preparationTotalSteps}</p>
              </div>
              <button
                aria-label={t('cancel')}
                className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-base font-semibold leading-none text-slate-700"
                onClick={closePreparationWizard}
                data-tooltip={t('cancel')}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mb-5 border-b border-slate-200 pb-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('wizardStepLabel')} {preparationStep}/{preparationTotalSteps}
                </p>
                <p className="text-xs font-medium text-slate-500">{Math.round(preparationProgressPercent)}%</p>
              </div>

              <div className="mx-10">
                <div className="relative h-10">
                  <div
                    aria-label="Preparation wizard progress"
                    className="absolute top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200"
                    style={{ left: `calc(50% / ${preparationTotalSteps})`, right: `calc(50% / ${preparationTotalSteps})` }}
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={preparationTotalSteps}
                    aria-valuenow={preparationStep}
                  >
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${preparationProgressPercent}%` }} />
                  </div>

                  <ol className="pointer-events-none relative grid h-full grid-cols-4 items-center">
                    {preparationStepLabels.map((stepLabel, index) => {
                      const stepNumber = index + 1;
                      const isCompleted = stepNumber < preparationStep;
                      const isCurrent = stepNumber === preparationStep;

                      return (
                        <li key={`preparation-progress-dot-${stepLabel}`} className="flex justify-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full border font-semibold transition-all duration-200 ${
                              isCurrent ? 'h-10 w-10 text-base' : 'h-6 w-6 text-xs'
                            } ${
                              isCurrent
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : isCompleted
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600'
                            }`}
                          >
                            {stepNumber}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <ol className="mt-6 grid grid-cols-4">
                  {preparationStepLabels.map((stepLabel, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < preparationStep;
                    const isCurrent = stepNumber === preparationStep;

                    return (
                      <li
                        key={`preparation-progress-label-${stepLabel}`}
                        className={`px-1 text-center text-xs font-medium leading-tight ${
                          isCurrent
                            ? 'text-orange-600'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {t(stepLabel)}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {preparationStep === 1 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-slate-900">{t('prepWizardStep1Title')}</h4>
                {recipeIngredients.length === 0 && (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{t('prepWizardNoIngredients')}</p>
                )}
                {recipeIngredients.length > 0 && (
                  <ul className="space-y-2">
                    {recipeIngredients.map((ingredient, index) => {
                      const checked = Boolean(preparedIngredients[index]);
                      return (
                        <li key={`${currentRecipe.id}-prep-ingredient-${index}`} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
                          <button
                            aria-label={`${t('ingredientItem')} ${index + 1}`}
                            className={`instant-tooltip inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              checked
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-transparent'
                            }`}
                            onClick={() => togglePreparedIngredient(index)}
                            data-tooltip={`${t('ingredientItem')} ${index + 1}`}
                            type="button"
                          >
                            ✓
                          </button>
                          <span className={`text-sm ${checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{ingredient}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {preparationStep === 2 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-slate-900">{t('prepWizardStep2Title')}</h4>
                {recipeSteps.length === 0 && (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{t('prepWizardNoSteps')}</p>
                )}
                {recipeSteps.length > 0 && (
                  <ul className="space-y-2">
                    {recipeSteps.map((step, index) => {
                      const checked = Boolean(preparedSteps[index]);
                      return (
                        <li key={`${currentRecipe.id}-prep-step-${index}`} className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-2">
                          <button
                            aria-label={`${t('stepItem')} ${index + 1}`}
                            className={`instant-tooltip mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              checked
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-transparent'
                            }`}
                            onClick={() => togglePreparedStep(index)}
                            data-tooltip={`${t('stepItem')} ${index + 1}`}
                            type="button"
                          >
                            ✓
                          </button>
                          <span className={`text-sm ${checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{step}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {preparationStep === 3 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-slate-900">{t('prepWizardStep3Title')}</h4>
                {recipeNotes.length > 0 ? (
                  <p className="whitespace-pre-line rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {recipeNotes}
                  </p>
                ) : (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{t('prepWizardNoNotes')}</p>
                )}
              </div>
            )}

            {preparationStep === 4 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center">
                <h4 className="text-xl font-semibold text-emerald-800">{t('prepWizardSuccessTitle')}</h4>
                <p className="mt-2 whitespace-pre-line text-sm text-emerald-700">{t('prepWizardSuccessMessage')}</p>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2">
              {preparationStep > 1 && (
                <button
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setPreparationStep((step) => Math.max(1, step - 1))}
                  type="button"
                >
                  {t('wizardBack')}
                </button>
              )}

              {preparationStep < 4 && (
                <button
                  className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => setPreparationStep((step) => Math.min(4, step + 1))}
                  type="button"
                >
                  {t('wizardNext')}
                </button>
              )}

              {preparationStep === 4 && (
                <button
                  className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  onClick={closePreparationWizard}
                  type="button"
                >
                  {t('prepWizardFinish')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </section>
  );
}
