import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { getLocalizedRecipe } from '../i18n/recipeContent';
import { useLanguage } from '../i18n/useLanguage';
import type { Recipe } from '../types/recipe';

const FIRST_HERO_IMAGE_URL = '/hero-first.png';

function extractCreatedAtFromId(recipeId: string): number {
  const match = recipeId.match(/-(\d{10,})$/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByNewest(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort((a, b) => {
    const byTime = extractCreatedAtFromId(b.id) - extractCreatedAtFromId(a.id);
    if (byTime !== 0) {
      return byTime;
    }

    return a.title.localeCompare(b.title);
  });
}

function trimDescription(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= 130) {
    return normalized;
  }

  return `${normalized.slice(0, 127).trimEnd()}...`;
}

export function HomePage() {
  const { t, language } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const latestRecipes = useMemo(() => {
    return sortByNewest(recipes).slice(0, 4);
  }, [recipes]);

  const heroSlides = useMemo(
    () => {
      const recipeSlides = latestRecipes.map((recipe) => {
        const localized = getLocalizedRecipe(recipe, language);
        return {
          id: recipe.id,
          linkTo: `/recipes/${recipe.id}`,
          title: localized.title,
          description: trimDescription(localized.description),
          imageUrl: recipe.photoUrls?.find((item) => item.trim())?.trim() ?? '',
        };
      });

      return [
        {
          id: 'hero-static-first',
          linkTo: '/recipes',
          title: t('homeLatestRecipesTitle'),
          description: t('homeLatestRecipesSubtitle'),
          imageUrl: FIRST_HERO_IMAGE_URL,
        },
        ...recipeSlides,
      ];
    },
    [language, latestRecipes, t],
  );

  useEffect(() => {
    setActiveSlideIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroSlides.length]);

  const activeSlide = heroSlides[activeSlideIndex] ?? null;
  const isStaticFirstSlide = activeSlide?.id === 'hero-static-first';

  function goToPreviousSlide() {
    if (heroSlides.length <= 1) {
      return;
    }

    setActiveSlideIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  }

  function goToNextSlide() {
    if (heroSlides.length <= 1) {
      return;
    }

    setActiveSlideIndex((current) => (current + 1) % heroSlides.length);
  }

  return (
    <section aria-label="home-page" className="min-h-[320px] space-y-4">
      {!isLoading && activeSlide && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
          {activeSlide.imageUrl ? (
            <img
              alt={activeSlide.title}
              className="h-[320px] w-full object-cover sm:h-[360px]"
              loading="lazy"
              src={activeSlide.imageUrl}
            />
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center bg-slate-800 text-sm text-slate-200 sm:h-[360px]">
              {t('noPhotoPlaceholder')}
            </div>
          )}

          {!isStaticFirstSlide && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/90">{t('homeLatestRecipesTitle')}</p>
                <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{activeSlide.title}</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-100/95">{activeSlide.description}</p>
                <Link
                  className="mt-3 inline-flex rounded-md border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  to={activeSlide.linkTo}
                >
                  {t('viewDetails')}
                </Link>
              </div>
            </>
          )}

          {heroSlides.length > 1 && (
            <>
              <button
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/25 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/40"
                onClick={goToPreviousSlide}
                type="button"
              >
                ‹
              </button>
              <button
                aria-label="Next slide"
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/25 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/40"
                onClick={goToNextSlide}
                type="button"
              >
                ›
              </button>

              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 sm:bottom-4 sm:right-6">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`hero-dot-${slide.id}`}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${index === activeSlideIndex ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
                    onClick={() => setActiveSlideIndex(index)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('homeLatestRecipesTitle')}</h2>
          <p className="text-sm text-slate-600">{t('homeLatestRecipesSubtitle')}</p>
        </div>
        <Link className="text-sm font-medium text-slate-900 underline underline-offset-4" to="/recipes">
          {t('recipesTitle')}
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('loadingRecipes')}</p>}
      {error && <p className="text-sm text-amber-700">{error}</p>}

      {!isLoading && latestRecipes.length === 0 && <p className="text-sm text-slate-500">{t('noRecipes')}</p>}

      <RecipeList recipes={latestRecipes} />
    </section>
  );
}
