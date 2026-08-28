import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { canApproveRecipe, canEditRecipe, canParticipate } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import { deleteRecipeById, updateRecipe } from '../data/recipes';
import { useRecipeDetails } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import type { TranslationKey } from '../i18n/translations';
import { useLanguage } from '../i18n/useLanguage';
import { addRecipeComment, deleteRecipeComment, getRecipeComments, type RecipeComment, updateRecipeComment } from '../lib/recipeComments';
import { hasUserFavoritedRecipe, setUserRecipeFavorite } from '../lib/recipeFavorites';
import { getMainProductMeta, getMainProductsMeta } from '../lib/mainProduct';
import { openPublicUserCard } from '../lib/publicUserCard';
import { getRecipeAverageRating, getUserRecipeRating, setUserRecipeRating } from '../lib/recipeRatings';
import { hasUserTriedRecipe, setUserTriedRecipe } from '../lib/recipeTried';
import { getUserDisplayName, getUserProfileLinkId } from '../lib/userDisplay';
import { addUserMessage } from '../lib/userMessages';
import type { Recipe, RecipeCuisine, RecipeDishType } from '../types/recipe';

const DISH_TYPE_ICONS: Record<RecipeDishType, string> = {
  main: '🍽️',
  dessert: '🍰',
  soup: '🍲',
  salad: '🥗',
  appetizer: '🥟',
  breakfast: '🍳',
};

const CUISINE_ICONS: Record<RecipeCuisine, string> = {
  bulgarian: '🇧🇬',
  french: '🇫🇷',
  asian: '🥢',
  italian: '🇮🇹',
  mexican: '🇲🇽',
  spanish: '🇪🇸',
  turkish: '🇹🇷',
  vegan: '🌿',
  vegetarian: '🥬',
  international: '🌍',
};

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

function toDishTypeLabelKey(value: Recipe['dishType']): TranslationKey {
  return value === 'dessert'
    ? 'dishTypeDessert'
    : value === 'soup'
    ? 'dishTypeSoup'
    : value === 'salad'
    ? 'dishTypeSalad'
    : value === 'appetizer'
    ? 'dishTypeAppetizer'
    : value === 'breakfast'
    ? 'dishTypeBreakfast'
    : 'dishTypeMain';
}

function toCuisineLabelKey(value: Recipe['cuisine']): TranslationKey {
  return value === 'bulgarian'
    ? 'cuisineBulgarian'
    : value === 'french'
    ? 'cuisineFrench'
    : value === 'asian'
    ? 'cuisineAsian'
    : value === 'italian'
    ? 'cuisineItalian'
    : value === 'mexican'
    ? 'cuisineMexican'
    : value === 'spanish'
    ? 'cuisineSpanish'
    : value === 'turkish'
    ? 'cuisineTurkish'
    : value === 'vegan'
    ? 'cuisineVegan'
    : value === 'vegetarian'
    ? 'cuisineVegetarian'
    : 'cuisineInternational';
}

export function RecipeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { role, userId } = useUserRole();
  const canUseTried = canParticipate(role);
  const canUseSocialRating = canParticipate(role);
  const canMessageCreator = canParticipate(role);
  const canWriteComments = canParticipate(role);
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
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
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
  const creatorName = currentRecipe ? getUserDisplayName(currentRecipe.ownerId, currentRecipe.ownerRole) : '';

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
        dishTypes: currentRecipe.dishTypes,
        cuisine: currentRecipe.cuisine,
        cuisines: currentRecipe.cuisines,
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
        dishTypes: currentRecipe.dishTypes,
        cuisine: currentRecipe.cuisine,
        cuisines: currentRecipe.cuisines,
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
        dishTypes: currentRecipe.dishTypes,
        cuisine: currentRecipe.cuisine,
        cuisines: currentRecipe.cuisines,
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
        dishTypes: currentRecipe.dishTypes,
        cuisine: currentRecipe.cuisine,
        cuisines: currentRecipe.cuisines,
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
    const isValidReplyTarget = replyingToCommentId
      ? comments.some((comment) => comment.id === replyingToCommentId)
      : false;

    addRecipeComment(userId, currentRecipe.id, trimmedComment, isValidReplyTarget ? replyingToCommentId : null);
    setCommentText('');
    setReplyingToCommentId(null);
    setReviewSuccess(t('commentSent'));
    setComments(getRecipeComments(currentRecipe.id));
  }

  function handleStartReply(comment: RecipeComment) {
    setReplyingToCommentId(comment.id);
    setApprovalError(null);
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
    if (replyingToCommentId === comment.id) {
      setReplyingToCommentId(null);
    }
    setReviewSuccess(t('commentDeleted'));
    setApprovalError(null);
  }

  function buildReportCommentScreenshot(comment: RecipeComment): string {
    if (typeof document === 'undefined') {
      return '';
    }

    const canvas = document.createElement('canvas');
    const width = 920;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      return '';
    }

    const ctx = context;

    const authorLabel = getCommentAuthorLabel(comment);
    const timestamp = new Date(comment.createdAt).toLocaleString();
    const text = comment.text || '';
    const horizontalPadding = 24;
    const verticalPadding = 26;
    const maxTextWidth = width - horizontalPadding * 2;
    const lineHeight = 26;

    function wrapText(input: string): string[] {
      const words = input.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxTextWidth) {
          currentLine = candidate;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.slice(0, 6);
    }

    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

    ctx.fillStyle = '#92400e';
    ctx.font = '700 24px Georgia, serif';
    ctx.fillText('Докладван коментар', horizontalPadding, verticalPadding + 6);

    ctx.fillStyle = '#7c2d12';
    ctx.font = '600 18px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText(`${authorLabel} · ${timestamp}`, horizontalPadding, verticalPadding + 42);

    ctx.fillStyle = '#1f2937';
    ctx.font = '500 22px "Trebuchet MS", "Segoe UI", sans-serif';

    const lines = wrapText(text);
    lines.forEach((line, index) => {
      ctx.fillText(line, horizontalPadding, verticalPadding + 86 + index * lineHeight);
    });

    return canvas.toDataURL('image/png');
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
    ].join('\n');

    const canonicalAdminId = getUserProfileLinkId('admin-user-1', 'admin');
    const canonicalReporterId = getUserProfileLinkId(userId, 'registered');
    const reporterAlias = getUserDisplayName(canonicalReporterId || userId, 'registered');
    const canonicalReportedAuthorId = getUserProfileLinkId(comment.userId, 'registered');
    const reportedAuthorAlias = getUserDisplayName(canonicalReportedAuthorId || comment.userId, 'registered');
    const reportImageDataUrl = buildReportCommentScreenshot(comment);

    addUserMessage(canonicalAdminId, currentRecipe.id, reportText, {
      imageDataUrl: reportImageDataUrl || undefined,
      fromUserId: canonicalReporterId || userId,
      fromUserAlias: reporterAlias,
      reportedAuthorUserId: canonicalReportedAuthorId || comment.userId,
      reportedAuthorAlias,
    });
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

  function handleRegisteredRequiredAction(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setApprovalError(t('registeredRequiredTooltip'));
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
  const searchParams = new URLSearchParams(location.search);
  const selectedDishTypeFilters = new Set(
    (searchParams.get('dishTypes') ?? searchParams.get('dishType') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const selectedCuisineFilters = new Set(
    (searchParams.get('cuisines') ?? searchParams.get('cuisine') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const recipeDishTypes: NonNullable<Recipe['dishTypes']> = currentRecipe.dishTypes?.length
    ? currentRecipe.dishTypes
    : currentRecipe.dishType
    ? [currentRecipe.dishType]
    : ['main'];
  const recipeCuisines: NonNullable<Recipe['cuisines']> = currentRecipe.cuisines?.length
    ? currentRecipe.cuisines
    : currentRecipe.cuisine
    ? [currentRecipe.cuisine]
    : ['international'];
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
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const rootComments = comments.filter(
    (comment) => !comment.parentCommentId || !commentById.has(comment.parentCommentId),
  );
  const repliesByParent = comments.reduce((accumulator, comment) => {
    if (!comment.parentCommentId || !commentById.has(comment.parentCommentId)) {
      return accumulator;
    }

    const existing = accumulator.get(comment.parentCommentId) ?? [];
    existing.push(comment);
    accumulator.set(comment.parentCommentId, existing);
    return accumulator;
  }, new Map<string, RecipeComment[]>());
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
      const selected = new Set(
        (nextParams.get('dishTypes') ?? nextParams.get('dishType') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );

      if (selected.has(nextDishType)) {
        selected.delete(nextDishType);
      } else {
        selected.add(nextDishType);
      }

      if (selected.size === 0) {
        nextParams.delete('dishTypes');
      } else {
        nextParams.set('dishTypes', Array.from(selected).join(','));
      }

      nextParams.delete('dishType');
    }

    if (nextCuisine) {
      const selected = new Set(
        (nextParams.get('cuisines') ?? nextParams.get('cuisine') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );

      if (selected.has(nextCuisine)) {
        selected.delete(nextCuisine);
      } else {
        selected.add(nextCuisine);
      }

      if (selected.size === 0) {
        nextParams.delete('cuisines');
      } else {
        nextParams.set('cuisines', Array.from(selected).join(','));
      }

      nextParams.delete('cuisine');
    }

    const query = nextParams.toString();
    navigate(`/recipes${query ? `?${query}` : ''}`);
  }

  function getCommentAuthorLabel(comment: RecipeComment): string {
    const displayName = getUserDisplayName(comment.userId, 'registered');
    const safeDisplayName = displayName === comment.userId ? t('unknownCommentAuthor') : displayName;
    if (comment.userId === userId) {
      return safeDisplayName ? `${t('currentUserLabel')} (${safeDisplayName})` : t('currentUserLabel');
    }

    return safeDisplayName;
  }

  function getReplyPreviewLabel(commentId: string): string {
    const target = commentById.get(commentId);
    if (!target) {
      return '';
    }

    return getCommentAuthorLabel(target);
  }

  function getReplyParentLabel(comment: RecipeComment): string {
    const parentId = comment.parentCommentId;
    if (!parentId) {
      return '';
    }

    return getReplyPreviewLabel(parentId);
  }

  function getReplyParentComment(comment: RecipeComment): RecipeComment | null {
    const parentId = comment.parentCommentId;
    if (!parentId) {
      return null;
    }

    return commentById.get(parentId) ?? null;
  }

  function renderCommentItem(comment: RecipeComment, depth: number = 0) {
    const replies = repliesByParent.get(comment.id) ?? [];
    const isReply = depth > 0;
    const replyParentLabel = getReplyParentLabel(comment);
    const replyParentComment = getReplyParentComment(comment);

    return (
      <div
        key={comment.id}
        className={`rounded-md border border-slate-200 bg-white px-3 py-2 ${isReply ? 'ml-4 mt-2 border-l-4 border-l-sky-200' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <button
              className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
              onClick={() => openPublicUserCard(comment.userId)}
              type="button"
            >
              {getCommentAuthorLabel(comment)}
            </button>
            <span>· {new Date(comment.createdAt).toLocaleString()}</span>
          </div>
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
        {isReply && replyParentLabel && (
          <p className="mt-1 text-[11px] font-medium text-sky-700">
            {t('replyToLabel')}{' '}
            {replyParentComment ? (
              <button
                className="underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                onClick={() => openPublicUserCard(replyParentComment.userId)}
                type="button"
              >
                {replyParentLabel}
              </button>
            ) : (
              <span>{replyParentLabel}</span>
            )}
          </p>
        )}
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
            {(canWriteComments || comment.userId === userId) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {canWriteComments && (
                  <button
                    aria-label={t('replyComment')}
                    className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-300 bg-white text-sky-700 transition-colors hover:bg-sky-50"
                    onClick={() => handleStartReply(comment)}
                    data-tooltip={t('replyComment')}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 17L4 12l5-5" />
                      <path d="M20 18v-2a6 6 0 0 0-6-6H4" />
                    </svg>
                  </button>
                )}
                {comment.userId === userId && canWriteComments && (
                  <button
                    aria-label={t('editComment')}
                    className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => handleStartEditComment(comment)}
                    data-tooltip={t('editComment')}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                )}
                {comment.userId === userId && canWriteComments && (
                  <button
                    aria-label={t('deleteComment')}
                    className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300 bg-white text-rose-700 transition-colors hover:bg-rose-50"
                    onClick={() => handleDeleteComment(comment)}
                    data-tooltip={t('deleteComment')}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                )}
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
        {replies.length > 0 && <div className="mt-2 space-y-2">{replies.map((reply) => renderCommentItem(reply, depth + 1))}</div>}
      </div>
    );
  }

  return (
    <section aria-label="recipe-details-page" className="min-h-[320px]">
      <div className="fixed inset-0 z-40 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden p-4" onClick={() => navigate(recipesListPath)}>
        <div
          className="max-h-[90vh] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
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
      <p className="mt-2 text-sm text-slate-500">
        {t('recipeCreatorLabel')}:{' '}
        <button
          className="font-medium text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          onClick={() => openPublicUserCard(currentRecipe.ownerId, currentRecipe.ownerRole)}
          type="button"
        >
          {creatorName}
        </button>
      </p>
      {canSeeStatus && (
        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {statusLabel}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {recipeDishTypes.map((dishType) => {
          const isActive = selectedDishTypeFilters.has(dishType);

          return (
            <button
              key={`dish-type-tag-${dishType}`}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
              onClick={() => navigateWithMergedFilters(dishType)}
              type="button"
            >
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="text-sm leading-none">{DISH_TYPE_ICONS[dishType]}</span>
                <span>{t(toDishTypeLabelKey(dishType))}</span>
              </span>
            </button>
          );
        })}
        {recipeCuisines.map((cuisine) => {
          const isActive = selectedCuisineFilters.has(cuisine);

          return (
            <button
              key={`cuisine-tag-${cuisine}`}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700'
              }`}
              onClick={() => navigateWithMergedFilters(undefined, cuisine)}
              type="button"
            >
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="text-sm leading-none">{CUISINE_ICONS[cuisine]}</span>
                <span>{t(toCuisineLabelKey(cuisine))}</span>
              </span>
            </button>
          );
        })}
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
                  <button
                    aria-label={t('favoriteRecipe')}
                    aria-disabled={!canUseSocialRating}
                    className={`instant-tooltip inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-2xl leading-none shadow-md transition-colors ${
                      canUseSocialRating
                        ? isRecipeFavorite
                          ? 'border-rose-400 bg-rose-200 text-rose-700'
                          : 'border-red-900 bg-white text-red-900 hover:border-red-950 hover:text-red-950'
                        : 'cursor-not-allowed border-red-900 bg-white text-red-900 opacity-60'
                    }`}
                    onClick={canUseSocialRating ? handleToggleRecipeFavorite : handleRegisteredRequiredAction}
                    data-tooltip={canUseSocialRating ? t('favoriteRecipe') : t('registeredRequiredTooltip')}
                    type="button"
                  >
                    {canUseSocialRating && isRecipeFavorite ? (
                      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                      </svg>
                    )}
                  </button>
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
              <button
                aria-label={t('favoriteRecipe')}
                aria-disabled={!canUseSocialRating}
                className={`instant-tooltip inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl leading-none shadow-md transition-colors ${
                  canUseSocialRating
                    ? isRecipeFavorite
                      ? 'border-rose-400 bg-rose-200 text-rose-700'
                      : 'border-red-900 bg-white text-red-900 hover:border-red-950 hover:text-red-950'
                    : 'cursor-not-allowed border-red-900 bg-white text-red-900 opacity-60'
                }`}
                onClick={canUseSocialRating ? handleToggleRecipeFavorite : handleRegisteredRequiredAction}
                data-tooltip={canUseSocialRating ? t('favoriteRecipe') : t('registeredRequiredTooltip')}
                type="button"
              >
                {canUseSocialRating && isRecipeFavorite ? (
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                  </svg>
                )}
              </button>
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
        <span className="inline-flex items-center gap-1 text-slate-600">
          {t('myRatingLabel')}:
          <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => {
              const highlighted = value <= userRecipeRating;

              return (
                <button
                  key={`recipe-my-rating-${value}`}
                  aria-label={`${t('myRatingLabel')} ${value}`}
                  aria-disabled={!canUseSocialRating}
                  className={`instant-tooltip text-base leading-none ${
                    canUseSocialRating
                      ? `cursor-pointer ${highlighted ? 'text-emerald-500' : 'text-slate-300'}`
                      : 'cursor-not-allowed text-slate-300'
                  }`}
                  onClick={canUseSocialRating ? () => handleRateRecipe(value) : handleRegisteredRequiredAction}
                  data-tooltip={canUseSocialRating ? `${t('myRatingLabel')} ${value}` : t('registeredRequiredTooltip')}
                  type="button"
                >
                  ★
                </button>
              );
            })}
          </span>
        </span>
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
              aria-disabled={!canWriteComments}
              className={`instant-tooltip inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                canWriteComments
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
              onClick={canWriteComments ? openPreparationWizard : handleRegisteredRequiredAction}
              data-tooltip={canWriteComments ? t('prepWizardStart') : t('registeredRequiredTooltip')}
              type="button"
            >
              {t('prepWizardStart')}
            </button>
            <button
              aria-disabled={!canUseTried}
              className={`instant-tooltip inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                canUseTried
                  ? isRecipeTried
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-emerald-600 bg-transparent text-emerald-700 hover:bg-emerald-50'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
              onClick={canUseTried ? handleToggleRecipeTried : handleRegisteredRequiredAction}
              data-tooltip={canUseTried ? t('triedRecipe') : t('registeredRequiredTooltip')}
              type="button"
            >
              {`${t('triedRecipe')}${canUseTried && isRecipeTried ? '!' : '?'}`}
            </button>
            <button
              aria-disabled={!canMessageCreator || isSendingAuthorMessage}
              className={`instant-tooltip inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                canMessageCreator
                  ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
              disabled={canMessageCreator ? isSendingAuthorMessage : false}
              onClick={canMessageCreator ? () => setShowAuthorMessageDialog(true) : handleRegisteredRequiredAction}
              data-tooltip={canMessageCreator ? t('messageRecipeCreator') : t('registeredRequiredTooltip')}
              type="button"
            >
              {t('messageRecipeCreator')}
            </button>
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
          {rootComments.map((comment) => renderCommentItem(comment))}
        </div>
        <div className="mt-3">
          {canWriteComments && replyingToCommentId && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs text-sky-800">
              <span>{t('replyingToComment')} {getReplyPreviewLabel(replyingToCommentId)}</span>
              <button
                className="rounded border border-sky-300 bg-white px-2 py-0.5 text-xs text-sky-700"
                onClick={() => setReplyingToCommentId(null)}
                type="button"
              >
                {t('cancelReply')}
              </button>
            </div>
          )}
          <textarea
            className={`min-h-24 w-full rounded-md border px-3 py-2 text-sm ${
              canWriteComments
                ? 'border-slate-300 bg-white'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder={canWriteComments ? (replyingToCommentId ? t('replyPlaceholder') : t('commentsPlaceholder')) : t('registeredRequiredTooltip')}
            readOnly={!canWriteComments}
            value={commentText}
          />
          <div className="mt-2">
            <button
              aria-disabled={!canWriteComments}
              className={`instant-tooltip rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                canWriteComments
                  ? 'bg-sky-400 text-white hover:bg-sky-500'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
              onClick={canWriteComments ? handlePostComment : handleRegisteredRequiredAction}
              data-tooltip={canWriteComments ? t('sendComment') : t('registeredRequiredTooltip')}
              type="button"
            >
              {t('sendComment')}
            </button>
          </div>
          {!canWriteComments && <p className="mt-2 text-xs text-slate-500">{t('commentsOnlyRegistered')}</p>}
        </div>
      </div>
      <Link
        className="mt-6 inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
        to={recipesListPath}
      >
        {t('backToRecipes')}
      </Link>

      {isPreparationWizardOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/70 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100vh-2rem)] sm:p-5">
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

              <div className="mx-2 sm:mx-10">
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

            <div className="mt-5 flex flex-wrap items-center gap-2">
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
