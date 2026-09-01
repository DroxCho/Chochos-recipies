import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getLocalizedRecipe } from '../../i18n/recipeContent';
import type { TranslationKey } from '../../i18n/translations';
import { canParticipate } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
import { hasUserFavoritedRecipe, setUserRecipeFavorite } from '../../lib/recipeFavorites';
import { getMainProductMeta, getMainProductsMeta } from '../../lib/mainProduct';
import { openPublicUserCard } from '../../lib/publicUserCard';
import { getRecipeAverageRating, getUserRecipeRating } from '../../lib/recipeRatings';
import { hasUserTriedRecipe } from '../../lib/recipeTried';
import { getUserDisplayName } from '../../lib/userDisplay';
import type { Recipe, RecipeCuisine, RecipeDishType } from '../../types/recipe';

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

const DEFAULT_RECIPE_IMAGE_URL = '/hero-first.png';
const LEGACY_RECIPE_IMAGE_URL = '/hero-first.png';

function isLegacyFallbackPhotoUrl(url: string): boolean {
  return url === LEGACY_RECIPE_IMAGE_URL || url.endsWith(LEGACY_RECIPE_IMAGE_URL);
}

interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (id: string) => Promise<void>;
  isDeleting?: boolean;
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

export function RecipeCard({ recipe, onDelete, isDeleting = false }: RecipeCardProps) {
  const { t, language } = useLanguage();
  const { role, userId } = useUserRole();
  const canUseTried = canParticipate(role);
  const canUseFavorites = canParticipate(role);
  const canUseSocialRating = canParticipate(role);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const localizedRecipe = getLocalizedRecipe(recipe, language);
  const trimmedDescription =
    localizedRecipe.description.length > 140
      ? `${localizedRecipe.description.slice(0, 137).trimEnd()}...`
      : localizedRecipe.description;
  const primaryPhotoUrl = recipe.photoUrls?.[0]?.trim() ?? '';
  const recipeImage = !primaryPhotoUrl || isLegacyFallbackPhotoUrl(primaryPhotoUrl)
    ? DEFAULT_RECIPE_IMAGE_URL
    : primaryPhotoUrl;
  const complexityStars = complexityToStars(recipe.complexity);
  const canSeeStatus = role === 'admin' || recipe.ownerId === userId;
  const selectedDishTypes = useMemo(
    () =>
      (searchParams.get('dishTypes') ?? searchParams.get('dishType') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [searchParams],
  );
  const selectedCuisines = useMemo(
    () =>
      (searchParams.get('cuisines') ?? searchParams.get('cuisine') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [searchParams],
  );
  const selectedMainProducts = useMemo(
    () =>
      (searchParams.get('mainProducts') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [searchParams],
  );
  const listQuery = searchParams.toString();
  const recipeDishTypes: NonNullable<Recipe['dishTypes']> = recipe.dishTypes?.length
    ? recipe.dishTypes
    : recipe.dishType
    ? [recipe.dishType]
    : ['main'];
  const recipeCuisines: NonNullable<Recipe['cuisines']> = recipe.cuisines?.length
    ? recipe.cuisines
    : recipe.cuisine
    ? [recipe.cuisine]
    : ['international'];
  const canDeleteFromCard = role === 'admin' && typeof onDelete === 'function';
  const isRecipeTried = canUseTried && hasUserTriedRecipe(userId, recipe.id);
  const [isRecipeFavorite, setIsRecipeFavorite] = useState(false);
  const [userRecipeRating, setUserRecipeRatingState] = useState<number>(0);
  const [recipeRatingAverage, setRecipeRatingAverage] = useState<number>(0);
  const [recipeRatingCount, setRecipeRatingCount] = useState<number>(0);
  const mainProductMetas = recipe.mainProducts?.length
    ? getMainProductsMeta(recipe.mainProducts, language)
    : (() => {
        const fallback = getMainProductMeta(recipe.mainProduct, language);
        return fallback
          ? [{ key: recipe.mainProduct ?? 'fallback-main-product', icon: fallback.icon, iconType: fallback.iconType, label: fallback.label }]
          : [];
      })();

  useEffect(() => {
    if (!canUseFavorites) {
      setIsRecipeFavorite(false);
      return;
    }

    setIsRecipeFavorite(hasUserFavoritedRecipe(userId, recipe.id));
  }, [canUseFavorites, recipe.id, userId]);

  useEffect(() => {
    if (!canUseSocialRating) {
      setUserRecipeRatingState(0);
      setRecipeRatingAverage(0);
      setRecipeRatingCount(0);
      return;
    }

    const userRating = getUserRecipeRating(userId, recipe.id) ?? 0;
    const recipeRating = getRecipeAverageRating(recipe.id);

    setUserRecipeRatingState(userRating);
    setRecipeRatingAverage(recipeRating.average);
    setRecipeRatingCount(recipeRating.count);
  }, [canUseSocialRating, recipe.id, userId]);

  const roundedAverageRating = Math.round((recipeRatingAverage || 0) * 2) / 2;
  const creatorName = getUserDisplayName(recipe.ownerId, recipe.ownerRole);

  function navigateWithMergedFilters(nextDishType?: string, nextCuisine?: string) {
    const nextParams = new URLSearchParams(searchParams);

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

  function navigateWithMainProductFilter(mainProduct: string) {
    const nextParams = new URLSearchParams(searchParams);
    const selectedMainProducts = (nextParams.get('mainProducts') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const selectedSet = new Set(selectedMainProducts);

    if (selectedSet.has(mainProduct)) {
      selectedSet.delete(mainProduct);
    } else {
      selectedSet.add(mainProduct);
    }

    const nextValues = [...selectedSet];
    if (nextValues.length === 0) {
      nextParams.delete('mainProducts');
    } else {
      nextParams.set('mainProducts', nextValues.join(','));
    }

    const query = nextParams.toString();
    navigate(`/recipes${query ? `?${query}` : ''}`);
  }

  function dismissTooltip(button: HTMLButtonElement) {
    button.blur();
    const tooltipText = button.getAttribute('data-tooltip');
    if (!tooltipText) {
      return;
    }

    button.setAttribute('data-tooltip', '');
    window.requestAnimationFrame(() => {
      button.setAttribute('data-tooltip', tooltipText);
    });
  }
  const statusLabel =
    recipe.status === 'pending'
      ? t('pendingStatus')
      : recipe.status === 'rejected'
      ? t('rejectedStatus')
      : recipe.status === 'changes_requested'
      ? t('changesRequestedStatus')
      : t('approvedStatus');

  async function handleDeleteFromCard(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!canDeleteFromCard || isDeleting) {
      return;
    }

    if (!window.confirm(t('deleteRecipeConfirm'))) {
      return;
    }

    await onDelete(recipe.id);
  }

  function handleToggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!canUseFavorites) {
      return;
    }

    const nextValue = !isRecipeFavorite;
    setIsRecipeFavorite(nextValue);
    setUserRecipeFavorite(userId, recipe.id, nextValue);
  }

  return (
    <div className="group relative block h-full">
      <Link
        className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        to={`/recipes/${recipe.id}${listQuery ? `?${listQuery}` : ''}`}
      >
      <article className="flex h-full min-h-[450px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-200 ease-out group-hover:scale-[1.02] group-hover:shadow-md">
      <div className="relative mb-3">
        <img
          alt={localizedRecipe.title}
          className="aspect-square w-full rounded-lg object-cover transition-transform duration-200 ease-out group-hover:scale-[1.01]"
          loading="lazy"
          src={recipeImage}
        />
        {(mainProductMetas.length > 0 || canUseFavorites || (isRecipeTried && canUseTried)) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {mainProductMetas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {mainProductMetas.map((item) => (
                  (() => {
                    const isMainProductActive = selectedMainProducts.includes(item.key);

                    return (
                  <button
                    key={`main-product-icon-${item.key}`}
                    aria-label={`${t('mainIngredient')}: ${item.label}`}
                    className={`instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border text-base shadow-sm transition hover:scale-105 ${
                      isMainProductActive
                        ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-300/70'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    data-tooltip={`${t('mainIngredient')}: ${item.label}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      dismissTooltip(event.currentTarget);
                      navigateWithMainProductFilter(item.key);
                    }}
                    style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                    type="button"
                  >
                    {item.icon}
                  </button>
                    );
                  })()
                ))}
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
            {isRecipeTried && canUseTried && (
              <span
                aria-label={t('triedRecipe')}
                className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-700 bg-emerald-600 text-xs font-black text-white shadow-sm"
                data-tooltip={t('triedRecipe')}
              >
                ✓
              </span>
            )}
            {canUseFavorites && (
              <button
                aria-label={t('favoriteRecipe')}
                className={`instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-base leading-none shadow-sm transition-colors ${
                  isRecipeFavorite
                    ? 'border-rose-400 bg-rose-200 text-rose-700'
                    : 'border-red-900 bg-white text-red-900 hover:border-red-950 hover:text-red-950'
                }`}
                onClick={handleToggleFavorite}
                data-tooltip={t('favoriteRecipe')}
                type="button"
              >
                {isRecipeFavorite ? (
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-6.7-4.35-9.33-8.28C.86 10.02 1.67 6.5 4.83 5.2 7.14 4.25 9.8 5.1 12 7.08c2.2-1.98 4.86-2.83 7.17-1.88 3.16 1.3 3.97 4.82 2.16 7.52C18.7 16.65 12 21 12 21z" />
                  </svg>
                )}
              </button>
            )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canSeeStatus && (
          <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {statusLabel}
          </p>
        )}
        {recipeDishTypes.map((dishType) => {
          const isActive = selectedDishTypes.includes(dishType);

          return (
            <p
              key={`recipe-card-dish-${recipe.id}-${dishType}`}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <span
                className="cursor-pointer"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigateWithMergedFilters(dishType);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    navigateWithMergedFilters(dishType);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className="text-sm leading-none">{DISH_TYPE_ICONS[dishType]}</span>
                  <span>{t(toDishTypeLabelKey(dishType))}</span>
                </span>
              </span>
            </p>
          );
        })}
        {recipeCuisines.map((cuisine) => {
          const isActive = selectedCuisines.includes(cuisine);

          return (
            <p
              key={`recipe-card-cuisine-${recipe.id}-${cuisine}`}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700'
              }`}
            >
              <span
                className="cursor-pointer"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigateWithMergedFilters(undefined, cuisine);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    navigateWithMergedFilters(undefined, cuisine);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className="text-sm leading-none">{CUISINE_ICONS[cuisine]}</span>
                  <span>{t(toCuisineLabelKey(cuisine))}</span>
                </span>
              </span>
            </p>
          );
        })}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{localizedRecipe.title}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {t('recipeCreatorLabel')}:{' '}
        <button
          className="font-medium text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openPublicUserCard(recipe.ownerId, recipe.ownerRole);
          }}
          type="button"
        >
          {creatorName}
        </button>
      </p>
      <p className="mt-2 min-h-[60px] text-clamp-3 text-sm text-slate-600">{trimmedDescription}</p>
      <div className="mt-4 flex flex-wrap items-start gap-x-3 gap-y-2 text-xs text-slate-500">
        <span>{recipe.prepMinutes} {t('minutesShort')}</span>
        <span>{recipe.servings} {t('servingsShort')}</span>
        {complexityStars > 0 && (
          <span className="instant-tooltip inline-flex items-center gap-1 text-amber-500" aria-label={`${t('complexity')} ${complexityStars}`} data-tooltip={`${t('complexity')} ${complexityStars}/5`}>
            {'★'.repeat(complexityStars)}
            <span className="text-slate-500">({complexityStars}/5)</span>
          </span>
        )}
        {canUseSocialRating && (
          <span
            className="instant-tooltip flex w-full min-w-0 flex-wrap items-center gap-1 text-slate-600"
            data-tooltip={
              recipeRatingCount > 0
                ? `${t('ratingLabel')}: ${recipeRatingAverage.toFixed(1)}/5 (${recipeRatingCount})`
                : `${t('ratingLabel')}: ${t('ratingNoVotes')}`
            }
          >
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => {
                const fillPercent =
                  roundedAverageRating >= value ? 100 : roundedAverageRating === value - 0.5 ? 50 : 0;

                return (
                  <span
                    key={`card-rating-${recipe.id}-${value}`}
                    aria-label={`${t('ratingLabel')} ${value}`}
                    className="relative inline-flex text-sm leading-none"
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
          </span>
        )}
        {canUseSocialRating && (
          <span
            className="instant-tooltip flex w-full min-w-0 flex-wrap items-center gap-1 text-slate-600"
            data-tooltip={`${t('myRatingLabel')}: ${userRecipeRating}/5`}
          >
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={`card-my-rating-${recipe.id}-${value}`}
                  className={`text-sm leading-none ${value <= userRecipeRating ? 'text-emerald-500' : 'text-slate-300'}`}
                >
                  ★
                </span>
              ))}
            </span>
          </span>
        )}
      </div>
    </article>
      </Link>
      {canDeleteFromCard && (
        <button
          aria-label={t('deleteRecipe')}
          className="instant-tooltip absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-white text-base font-bold leading-none text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDeleting}
          onClick={handleDeleteFromCard}
          data-tooltip={t('deleteRecipe')}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}
