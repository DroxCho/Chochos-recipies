import { useEffect, useMemo, useRef, useState } from 'react';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import { useLanguage } from '../i18n/useLanguage';
import type { RecipeCuisine, RecipeDishType } from '../types/recipe';

export function RecipesPage() {
  const { t, language } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();
  const pageSize = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDishType, setSelectedDishType] = useState<'all' | RecipeDishType>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<'all' | RecipeCuisine>('all');
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const dishTypeOptions: Array<{ value: 'all' | RecipeDishType; label: string }> = [
    { value: 'all', label: t('allDishTypes') },
    { value: 'main', label: t('dishTypeMain') },
    { value: 'dessert', label: t('dishTypeDessert') },
    { value: 'soup', label: t('dishTypeSoup') },
    { value: 'salad', label: t('dishTypeSalad') },
    { value: 'appetizer', label: t('dishTypeAppetizer') },
    { value: 'breakfast', label: t('dishTypeBreakfast') },
  ];

  const cuisineOptions: Array<{ value: 'all' | RecipeCuisine; label: string }> = [
    { value: 'all', label: t('allCuisines') },
    { value: 'bulgarian', label: t('cuisineBulgarian') },
    { value: 'french', label: t('cuisineFrench') },
    { value: 'asian', label: t('cuisineAsian') },
    { value: 'italian', label: t('cuisineItalian') },
    { value: 'mexican', label: t('cuisineMexican') },
    { value: 'spanish', label: t('cuisineSpanish') },
    { value: 'turkish', label: t('cuisineTurkish') },
    { value: 'international', label: t('cuisineInternational') },
  ];

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (selectedDishType !== 'all' && recipe.dishType !== selectedDishType) {
        return false;
      }

      if (selectedCuisine !== 'all' && recipe.cuisine !== selectedCuisine) {
        return false;
      }

      if (!query) {
        return true;
      }

      const localizedRecipe = getLocalizedRecipe(recipe, language);
      const haystack = `${localizedRecipe.title} ${localizedRecipe.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [language, recipes, searchQuery, selectedCuisine, selectedDishType]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCuisine, selectedDishType]);

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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>{t('searchRecipes')}</span>
          <input
            className="w-64 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('searchRecipesPlaceholder')}
            type="search"
            value={searchQuery}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>{t('dishType')}</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            onChange={(event) => setSelectedDishType(event.target.value as 'all' | RecipeDishType)}
            value={selectedDishType}
          >
            {dishTypeOptions.map((option) => (
              <option key={`dish-type-filter-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span>{t('cuisineType')}</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            onChange={(event) => setSelectedCuisine(event.target.value as 'all' | RecipeCuisine)}
            value={selectedCuisine}
          >
            {cuisineOptions.map((option) => (
              <option key={`cuisine-filter-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && filteredRecipes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noRecipes')}</p>
      )}

      <RecipeList recipes={paginatedRecipes} />

      {!isLoading && currentPage < totalPages && (
        <div className="mt-4 flex justify-center">
          <span className="text-sm text-slate-500">{t('loadingRecipes')}</span>
        </div>
      )}

      <div ref={loadMoreTriggerRef} className="h-6 w-full" aria-hidden="true" />
    </section>
  );
}
