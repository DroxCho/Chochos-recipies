import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getLocalizedRecipe } from '../../i18n/recipeContent';
import type { TranslationKey } from '../../i18n/translations';
import { canParticipate } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
import { hasUserFavoritedRecipe, setUserRecipeFavorite } from '../../lib/recipeFavorites';
import { getMainProductMeta, getMainProductsMeta } from '../../lib/mainProduct';
import { getRecipeAverageRating, getUserRecipeRating } from '../../lib/recipeRatings';
import { hasUserTriedRecipe } from '../../lib/recipeTried';
import type { Recipe } from '../../types/recipe';

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
  const recipeImage = recipe.photoUrls?.[0]?.trim();
  const complexityStars = complexityToStars(recipe.complexity);
  const canSeeStatus = role === 'admin' || recipe.ownerId === userId;
  const selectedDishType = searchParams.get('dishType');
  const selectedCuisine = searchParams.get('cuisine');
  const listQuery = searchParams.toString();
  const isDishTypeActive = selectedDishType === (recipe.dishType ?? 'main');
  const isCuisineActive = selectedCuisine === (recipe.cuisine ?? 'international');
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

  function navigateWithMergedFilters(nextDishType?: string, nextCuisine?: string) {
    const nextParams = new URLSearchParams(searchParams);

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

  function navigateWithMainProductFilter(mainProduct: string) {
    const nextParams = new URLSearchParams(searchParams);
    const selectedMainProducts = (nextParams.get('mainProducts') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (selectedMainProducts.length === 1 && selectedMainProducts[0] === mainProduct) {
      nextParams.delete('mainProducts');
    } else {
      nextParams.set('mainProducts', mainProduct);
    }

    const query = nextParams.toString();
    navigate(`/recipes${query ? `?${query}` : ''}`);
  }
  const statusLabel =
    recipe.status === 'pending'
      ? t('pendingStatus')
      : recipe.status === 'rejected'
      ? t('rejectedStatus')
      : recipe.status === 'changes_requested'
      ? t('changesRequestedStatus')
      : t('approvedStatus');

  const dishTypeLabelKey: TranslationKey =
    recipe.dishType === 'dessert'
      ? 'dishTypeDessert'
      : recipe.dishType === 'soup'
      ? 'dishTypeSoup'
      : recipe.dishType === 'salad'
      ? 'dishTypeSalad'
      : recipe.dishType === 'appetizer'
      ? 'dishTypeAppetizer'
      : recipe.dishType === 'breakfast'
      ? 'dishTypeBreakfast'
      : 'dishTypeMain';

  const cuisineLabelKey: TranslationKey =
    recipe.cuisine === 'bulgarian'
      ? 'cuisineBulgarian'
      : recipe.cuisine === 'french'
      ? 'cuisineFrench'
      : recipe.cuisine === 'asian'
      ? 'cuisineAsian'
      : recipe.cuisine === 'italian'
      ? 'cuisineItalian'
      : recipe.cuisine === 'mexican'
      ? 'cuisineMexican'
      : recipe.cuisine === 'spanish'
      ? 'cuisineSpanish'
      : recipe.cuisine === 'turkish'
      ? 'cuisineTurkish'
      : recipe.cuisine === 'vegan'
      ? 'cuisineVegan'
      : recipe.cuisine === 'vegetarian'
      ? 'cuisineVegetarian'
      : 'cuisineInternational';

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
        {recipeImage && (
          <img
            alt={localizedRecipe.title}
            className="aspect-square w-full rounded-lg object-cover transition-transform duration-200 ease-out group-hover:scale-[1.01]"
            loading="lazy"
            src={recipeImage}
          />
        )}
        {!recipeImage && (
          <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            {t('noPhotoPlaceholder')}
          </div>
        )}
        {(mainProductMetas.length > 0 || canUseFavorites || (isRecipeTried && canUseTried)) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {mainProductMetas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {mainProductMetas.map((item) => (
                  <button
                    key={`main-product-icon-${item.key}`}
                    aria-label={`${t('mainIngredient')}: ${item.label}`}
                    className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-base text-slate-900 shadow-sm transition hover:scale-105"
                    data-tooltip={`${t('mainIngredient')}: ${item.label}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      navigateWithMainProductFilter(item.key);
                    }}
                    style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                    type="button"
                  >
                    {item.icon}
                  </button>
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
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-300 bg-white/90 text-slate-400 hover:bg-slate-50'
                }`}
                onClick={handleToggleFavorite}
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
      <div className="flex flex-wrap gap-2">
        {canSeeStatus && (
          <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {statusLabel}
          </p>
        )}
        <p
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isDishTypeActive ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          <span
            className="cursor-pointer"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigateWithMergedFilters(recipe.dishType ?? 'main');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                navigateWithMergedFilters(recipe.dishType ?? 'main');
              }
            }}
            role="button"
            tabIndex={0}
          >
            {t(dishTypeLabelKey)}
          </span>
        </p>
        <p
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isCuisineActive ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700'
          }`}
        >
          <span
            className="cursor-pointer"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigateWithMergedFilters(undefined, recipe.cuisine ?? 'international');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                navigateWithMergedFilters(undefined, recipe.cuisine ?? 'international');
              }
            }}
            role="button"
            tabIndex={0}
          >
            {t(cuisineLabelKey)}
          </span>
        </p>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{localizedRecipe.title}</h3>
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
