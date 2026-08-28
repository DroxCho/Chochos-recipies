import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import { useLanguage } from '../i18n/useLanguage';
import { getMainProductMeta } from '../lib/mainProduct';
import type { RecipeCuisine, RecipeDishType } from '../types/recipe';

const DISH_TYPE_VALUES: RecipeDishType[] = ['main', 'dessert', 'soup', 'salad', 'appetizer', 'breakfast'];
const CUISINE_VALUES: RecipeCuisine[] = [
  'bulgarian',
  'french',
  'asian',
  'italian',
  'mexican',
  'spanish',
  'turkish',
  'vegan',
  'vegetarian',
  'international',
];

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
const MAIN_PRODUCT_OPTIONS = [
  { value: 'agneshko-meso', label: 'Агнешко месо' },
  { value: 'bebeshki-hrani', label: 'Бебешки храни' },
  { value: 'bob', label: 'Боб' },
  { value: 'divech', label: 'Дивеч' },
  { value: 'zele', label: 'Зеле' },
  { value: 'zelenchuci', label: 'Зеленчуци' },
  { value: 'zaeshko-meso', label: 'Заешко месо' },
  { value: 'karantiya', label: 'Карантия' },
  { value: 'leshta', label: 'Леща' },
  { value: 'mlechni-produkti', label: 'Млечни продукти и заместители' },
  { value: 'morski-darove', label: 'Морски дарове' },
  { value: 'pateshko-meso', label: 'Патешко месо' },
  { value: 'pileshko-meso', label: 'Пилешко месо' },
  { value: 'plodove', label: 'Плодове' },
  { value: 'pueshko-meso', label: 'Пуешко месо' },
  { value: 'riba', label: 'Риба' },
  { value: 'oriz', label: 'Ориз' },
  { value: 'svinsko-meso', label: 'Свинско месо' },
  { value: 'pasta', label: 'Паста' },
  { value: 'sladoled', label: 'Сладолед' },
  { value: 'soleni-pechiva', label: 'Солени печива' },
  { value: 'teleshko-meso', label: 'Телешко месо' },
  { value: 'yastiya-s-yaitsa', label: 'Ястия с яйца' },
] as const;

type MainProductValue = (typeof MAIN_PRODUCT_OPTIONS)[number]['value'];

const MAIN_PRODUCT_VALUES: MainProductValue[] = MAIN_PRODUCT_OPTIONS.map((option) => option.value);

const MAIN_PRODUCT_KEYWORDS: Record<MainProductValue, string[]> = {
  'agneshko-meso': ['агнешк'],
  'bebeshki-hrani': ['бебешк'],
  bob: ['боб'],
  divech: ['дивеч', 'елен', 'сърна'],
  zele: ['зеле'],
  zelenchuci: ['зеленчук', 'морков', 'домати', 'краставиц', 'чушка'],
  'zaeshko-meso': ['заешк'],
  karantiya: ['дроб', 'сърце', 'шкембе', 'карантия'],
  leshta: ['леща'],
  'mlechni-produkti': ['мляко', 'сирене', 'кашкавал', 'извара', 'йогурт', 'сметана'],
  'morski-darove': ['морски дар', 'скарида', 'миди', 'калмари', 'октопод'],
  'pateshko-meso': ['патешк'],
  'pileshko-meso': ['пилешк', 'пиле'],
  plodove: ['плод', 'ябълк', 'круш', 'банан', 'ягод', 'малин'],
  'pueshko-meso': ['пуешк'],
  riba: ['риба', 'сьомга', 'пъстърва', 'скумрия', 'тон'],
  oriz: ['ориз'],
  'svinsko-meso': ['свинск'],
  pasta: ['паста', 'спагет', 'макарон', 'пене', 'фузили', 'талиателе'],
  sladoled: ['сладолед'],
  'soleni-pechiva': ['солен', 'баниц', 'питка'],
  'teleshko-meso': ['телешк', 'говежд'],
  'yastiya-s-yaitsa': ['яйц', 'омлет'],
};

function parseDishTypeFilter(value: string | null): 'all' | RecipeDishType {
  return value && DISH_TYPE_VALUES.includes(value as RecipeDishType) ? (value as RecipeDishType) : 'all';
}

function parseCuisineFilter(value: string | null): 'all' | RecipeCuisine {
  return value && CUISINE_VALUES.includes(value as RecipeCuisine) ? (value as RecipeCuisine) : 'all';
}

function parseMainProductsFilter(value: string | null): MainProductValue[] {
  if (!value) {
    return [];
  }

  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is MainProductValue => MAIN_PRODUCT_VALUES.includes(item as MainProductValue));

  return [...new Set(values)];
}

function recipeMatchesMainProduct(recipeText: string, mainProduct: MainProductValue): boolean {
  const keywords = MAIN_PRODUCT_KEYWORDS[mainProduct] ?? [];
  return keywords.some((keyword) => recipeText.includes(keyword));
}

export function RecipesPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { recipes, isLoading, deletingRecipeId, error, deleteExistingRecipe } = useRecipes();
  const pageSize = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDishTypeMenuOpen, setIsDishTypeMenuOpen] = useState(false);
  const [isCuisineMenuOpen, setIsCuisineMenuOpen] = useState(false);
  const [isMainProductMenuOpen, setIsMainProductMenuOpen] = useState(false);
  const selectedDishType = parseDishTypeFilter(searchParams.get('dishType'));
  const selectedCuisine = parseCuisineFilter(searchParams.get('cuisine'));
  const mainProductsParam = searchParams.get('mainProducts');
  const selectedMainProducts = useMemo(() => parseMainProductsFilter(mainProductsParam), [mainProductsParam]);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const dishTypeMenuRef = useRef<HTMLDivElement | null>(null);
  const cuisineMenuRef = useRef<HTMLDivElement | null>(null);
  const mainProductMenuRef = useRef<HTMLDivElement | null>(null);

  const dishTypeOptions: Array<{ value: 'all' | RecipeDishType; label: string }> = [
    { value: 'all', label: t('allDishTypes') },
    { value: 'main', label: `${DISH_TYPE_ICONS.main} ${t('dishTypeMain')}` },
    { value: 'dessert', label: `${DISH_TYPE_ICONS.dessert} ${t('dishTypeDessert')}` },
    { value: 'soup', label: `${DISH_TYPE_ICONS.soup} ${t('dishTypeSoup')}` },
    { value: 'salad', label: `${DISH_TYPE_ICONS.salad} ${t('dishTypeSalad')}` },
    { value: 'appetizer', label: `${DISH_TYPE_ICONS.appetizer} ${t('dishTypeAppetizer')}` },
    { value: 'breakfast', label: `${DISH_TYPE_ICONS.breakfast} ${t('dishTypeBreakfast')}` },
  ];

  const cuisineOptions: Array<{ value: 'all' | RecipeCuisine; label: string }> = [
    { value: 'all', label: t('allCuisines') },
    { value: 'bulgarian', label: `${CUISINE_ICONS.bulgarian} ${t('cuisineBulgarian')}` },
    { value: 'french', label: `${CUISINE_ICONS.french} ${t('cuisineFrench')}` },
    { value: 'asian', label: `${CUISINE_ICONS.asian} ${t('cuisineAsian')}` },
    { value: 'italian', label: `${CUISINE_ICONS.italian} ${t('cuisineItalian')}` },
    { value: 'mexican', label: `${CUISINE_ICONS.mexican} ${t('cuisineMexican')}` },
    { value: 'spanish', label: `${CUISINE_ICONS.spanish} ${t('cuisineSpanish')}` },
    { value: 'turkish', label: `${CUISINE_ICONS.turkish} ${t('cuisineTurkish')}` },
    { value: 'vegan', label: `${CUISINE_ICONS.vegan} ${t('cuisineVegan')}` },
    { value: 'vegetarian', label: `${CUISINE_ICONS.vegetarian} ${t('cuisineVegetarian')}` },
    { value: 'international', label: `${CUISINE_ICONS.international} ${t('cuisineInternational')}` },
  ];

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const localizedRecipe = getLocalizedRecipe(recipe, language);

      if (selectedDishType !== 'all' && recipe.dishType !== selectedDishType) {
        return false;
      }

      if (selectedCuisine !== 'all' && recipe.cuisine !== selectedCuisine) {
        return false;
      }

      if (selectedMainProducts.length > 0) {
        const savedMainProducts = (recipe.mainProducts && recipe.mainProducts.length > 0)
          ? recipe.mainProducts
          : recipe.mainProduct
          ? [recipe.mainProduct]
          : [];
        const matchesBySavedMainProduct = savedMainProducts.some((item) =>
          selectedMainProducts.includes(item as MainProductValue),
        );
        const recipeText = `${localizedRecipe.title} ${localizedRecipe.description} ${(recipe.ingredients ?? []).join(' ')}`.toLowerCase();
        const matchesByKeywords = selectedMainProducts.some((mainProduct) => recipeMatchesMainProduct(recipeText, mainProduct));
        const matchesMainProduct = matchesBySavedMainProduct || matchesByKeywords;

        if (!matchesMainProduct) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const haystack = `${localizedRecipe.title} ${localizedRecipe.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [language, recipes, searchQuery, selectedCuisine, selectedDishType, selectedMainProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCuisine, selectedDishType, selectedMainProducts]);

  useEffect(() => {
    if (!isDishTypeMenuOpen && !isCuisineMenuOpen && !isMainProductMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!dishTypeMenuRef.current?.contains(event.target as Node)) {
        setIsDishTypeMenuOpen(false);
      }

      if (!cuisineMenuRef.current?.contains(event.target as Node)) {
        setIsCuisineMenuOpen(false);
      }

      if (!mainProductMenuRef.current?.contains(event.target as Node)) {
        setIsMainProductMenuOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDishTypeMenuOpen(false);
        setIsCuisineMenuOpen(false);
        setIsMainProductMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isCuisineMenuOpen, isDishTypeMenuOpen, isMainProductMenuOpen]);

  function setDishTypeFilter(value: 'all' | RecipeDishType) {
    const nextParams = new URLSearchParams(searchParams);

    if (value === 'all') {
      nextParams.delete('dishType');
    } else {
      nextParams.set('dishType', value);
    }

    setSearchParams(nextParams, { replace: true });
  }

  function setCuisineFilter(value: 'all' | RecipeCuisine) {
    const nextParams = new URLSearchParams(searchParams);

    if (value === 'all') {
      nextParams.delete('cuisine');
    } else {
      nextParams.set('cuisine', value);
    }

    setSearchParams(nextParams, { replace: true });
  }

  function toggleMainProductSelection(productValue: MainProductValue) {
    const nextParams = new URLSearchParams(searchParams);
    const selected = new Set(selectedMainProducts);

    if (selected.has(productValue)) {
      selected.delete(productValue);
    } else {
      selected.add(productValue);
    }

    const nextValues = [...selected];
    if (nextValues.length === 0) {
      nextParams.delete('mainProducts');
    } else {
      nextParams.set('mainProducts', nextValues.join(','));
    }

    setSearchParams(nextParams, { replace: true });
  }

  function clearMainProductsFilter() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('mainProducts');
    setSearchParams(nextParams, { replace: true });
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || isLoading || currentPage >= totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setCurrentPage((page) => Math.min(totalPages, page + 1));
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [currentPage, isLoading, totalPages]);

  const paginatedRecipes = useMemo(() => {
    const end = currentPage * pageSize;
    return filteredRecipes.slice(0, end);
  }, [currentPage, filteredRecipes]);

  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('recipesTitle')}</h2>

      <div className="mb-4 flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <label className="order-1 flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap">
          <span>{t('searchRecipes')}</span>
          <input
            className="w-52 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm xl:w-64"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('searchRecipesPlaceholder')}
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="order-2 relative max-w-full shrink-0" ref={dishTypeMenuRef}>
          <span className="mr-2 text-sm text-slate-700">{t('dishType')}</span>
          <button
            aria-expanded={isDishTypeMenuOpen}
            aria-haspopup="menu"
            className="w-full min-w-48 rounded-md border border-slate-300 bg-white px-3 py-1 text-left text-sm text-slate-700 sm:w-auto"
            onClick={() => {
              setIsDishTypeMenuOpen((open) => !open);
              setIsCuisineMenuOpen(false);
            }}
            type="button"
          >
            {dishTypeOptions.find((option) => option.value === selectedDishType)?.label ?? t('allDishTypes')}
          </button>

          {isDishTypeMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg sm:w-80" role="menu">
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {dishTypeOptions.map((option) => {
                  const isSelected = selectedDishType === option.value;

                  return (
                    <button
                      key={`dish-type-filter-${option.value}`}
                      className={`flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${isSelected ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => {
                        setDishTypeFilter(option.value);
                        setIsDishTypeMenuOpen(false);
                      }}
                      role="menuitemradio"
                      aria-checked={isSelected}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="order-3 relative max-w-full shrink-0" ref={cuisineMenuRef}>
          <span className="mr-2 text-sm text-slate-700">{t('cuisineType')}</span>
          <button
            aria-expanded={isCuisineMenuOpen}
            aria-haspopup="menu"
            className="w-full min-w-48 rounded-md border border-slate-300 bg-white px-3 py-1 text-left text-sm text-slate-700 sm:w-auto"
            onClick={() => {
              setIsCuisineMenuOpen((open) => !open);
              setIsDishTypeMenuOpen(false);
            }}
            type="button"
          >
            {cuisineOptions.find((option) => option.value === selectedCuisine)?.label ?? t('allCuisines')}
          </button>

          {isCuisineMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg sm:w-80" role="menu">
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {cuisineOptions.map((option) => {
                  const isSelected = selectedCuisine === option.value;

                  return (
                    <button
                      key={`cuisine-filter-${option.value}`}
                      className={`flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${isSelected ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => {
                        setCuisineFilter(option.value);
                        setIsCuisineMenuOpen(false);
                      }}
                      role="menuitemradio"
                      aria-checked={isSelected}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="order-4 relative max-w-full shrink-0" ref={mainProductMenuRef}>
          <span className="mr-2 text-sm text-slate-700">{t('mainIngredient')}</span>
          <button
            className="w-full min-w-48 rounded-md border border-slate-300 bg-white px-3 py-1 text-left text-sm text-slate-700 sm:w-auto"
            onClick={() => setIsMainProductMenuOpen((open) => !open)}
            type="button"
          >
            {selectedMainProducts.length === 0
              ? t('allMainIngredients')
              : `${selectedMainProducts.length} ${t('selectedItems')}`}
          </button>

          {isMainProductMenuOpen && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 w-full max-w-full overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-lg sm:inset-x-auto sm:left-0 sm:w-80">
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {MAIN_PRODUCT_OPTIONS.map((option) => {
                  const checked = selectedMainProducts.includes(option.value);
                  const optionMeta = getMainProductMeta(option.value, language);
                  const icon = optionMeta?.icon ?? '•';
                  const localizedLabel = optionMeta?.label ?? option.label;

                  return (
                    <label key={`main-product-${option.value}`} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                      <span aria-hidden="true" className="text-base leading-none">{icon}</span>
                      <input
                        checked={checked}
                        onChange={() => toggleMainProductSelection(option.value)}
                        type="checkbox"
                      />
                      <span>{localizedLabel}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-start gap-2 border-t border-slate-200 pt-2 sm:justify-between">
                <button
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  onClick={clearMainProductsFilter}
                  type="button"
                >
                  {t('clearSelection')}
                </button>
                <button
                  className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
                  onClick={() => setIsMainProductMenuOpen(false)}
                  type="button"
                >
                  {t('done')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && filteredRecipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noRecipes')}</p>
      )}

      <RecipeList deletingRecipeId={deletingRecipeId} onDeleteRecipe={deleteExistingRecipe} recipes={paginatedRecipes} />

      {!isLoading && currentPage < totalPages && (
        <div className="mt-4 flex justify-center">
          <span className="text-sm text-slate-500">{t('loadingRecipes')}</span>
        </div>
      )}

      <div ref={loadMoreTriggerRef} className="h-6 w-full" aria-hidden="true" />
    </section>
  );
}
