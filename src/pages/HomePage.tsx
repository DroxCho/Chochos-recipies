import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';
import { useLanguage } from '../i18n/useLanguage';
import type { Recipe } from '../types/recipe';

const REFERENCE_HERO_SLIDES = [
  {
    id: 'hero-home',
    title: 'Домашно и вкусно',
    eyebrow: 'добре дошли на софрата',
    description: 'РЕЦЕПТИ ОТ СЕМЕЙНАТА КУХНЯ',
    imageUrl: '/hero-banitsa.jpg',
  },
  {
    id: 'hero-step-by-step',
    title: 'Стъпка по стъпка',
    eyebrow: 'добре дошли на софрата',
    description: 'КАКТО ГО ПРАВЕШЕ БАБА',
    imageUrl: '/hero-salad.jpg',
  },
  {
    id: 'hero-share',
    title: 'Сподели своята',
    eyebrow: 'добре дошли на софрата',
    description: 'РЕЦЕПТА С НАС',
    imageUrl: '/hero-banitsa.jpg',
  },
  {
    id: 'hero-kitchen',
    title: 'Домашно и вкусно',
    eyebrow: 'добре дошли на софрата',
    description: 'РЕЦЕПТИ ОТ СЕМЕЙНАТА КУХНЯ',
    imageUrl: '/hero-salad.jpg',
  },
] as const;

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

export function HomePage() {
  const { t } = useLanguage();
  const { recipes, isLoading, error } = useRecipes();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const latestRecipes = useMemo(() => {
    return sortByNewest(recipes).slice(0, 4);
  }, [recipes]);

  const heroSlides = useMemo(
    () => REFERENCE_HERO_SLIDES.map((slide) => ({ ...slide, linkTo: '/recipes' })),
    [],
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
              alt=""
              className="h-[320px] w-full object-cover opacity-35 sm:h-[360px]"
              loading="lazy"
              src={activeSlide.imageUrl}
            />
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center bg-slate-800 text-sm text-slate-200 sm:h-[360px]">
              {t('noPhotoPlaceholder')}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-16 text-center text-white">
            <p className="text-lg italic">{activeSlide.eyebrow}</p>
            <h3 className="text-4xl font-semibold sm:text-5xl">{activeSlide.title}</h3>
            <p className="text-xs tracking-[0.3em] text-white/90">{activeSlide.description}</p>
            <Link
              className="mt-2 border border-white/80 bg-white/15 px-5 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
              to={activeSlide.linkTo}
            >
              Разгледай рецептите
            </Link>
          </div>

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
