import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getLocalizedRecipe } from '../../i18n/recipeContent';
import type { TranslationKey } from '../../i18n/translations';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
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
  const isDishTypeActive = selectedDishType === (recipe.dishType ?? 'main');
  const isCuisineActive = selectedCuisine === (recipe.cuisine ?? 'international');
  const canDeleteFromCard = role === 'admin' && typeof onDelete === 'function';

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

  return (
    <div className="group relative block h-full">
      <Link
        className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        to={`/recipes/${recipe.id}`}
      >
      <article className="flex h-full min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-200 ease-out group-hover:scale-[1.02] group-hover:shadow-md">
      {recipeImage && (
        <img
          alt={localizedRecipe.title}
          className="mb-3 h-56 w-full rounded-lg object-cover transition-transform duration-200 ease-out group-hover:scale-[1.01]"
          loading="lazy"
          src={recipeImage}
        />
      )}
      {!recipeImage && (
        <div className="mb-3 flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          {t('noPhotoPlaceholder')}
        </div>
      )}
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
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span>{recipe.prepMinutes} {t('minutesShort')}</span>
        <span>{recipe.servings} {t('servingsShort')}</span>
        {complexityStars > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-500" aria-label={`${t('complexity')} ${complexityStars}`}>
            {'★'.repeat(complexityStars)}
            <span className="text-slate-500">({complexityStars}/5)</span>
          </span>
        )}
      </div>
      <span className="mt-auto pt-4 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4">
        {t('viewDetails')}
      </span>
    </article>
      </Link>
      {canDeleteFromCard && (
        <button
          aria-label={t('deleteRecipe')}
          className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-white text-base font-bold leading-none text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDeleting}
          onClick={handleDeleteFromCard}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}
