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
    imageUrl: '/logo-chocos-recipes.png',
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
  const isLogoSlide = activeSlide?.imageUrl === '/logo-chocos-recipes.png';
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
        <div
          className={`relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${
            isLogoSlide ? 'bg-[linear-gradient(180deg,#fffaf3_0%,#f6e9d7_100%)]' : 'bg-slate-900'
          }`}
        >
          {activeSlide.imageUrl ? (
            <img
              alt=""
              className={`h-[320px] w-full opacity-75 sm:h-[360px] ${
                isLogoSlide ? 'object-contain' : 'object-cover'
              }`}
              loading="lazy"
              src={activeSlide.imageUrl}
            />
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center bg-slate-800 text-sm text-slate-200 sm:h-[360px]">
              {t('noPhotoPlaceholder')}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-16 text-center text-[var(--rustic-bg)]">
            <p className="text-xl italic sm:text-2xl">{activeSlide.eyebrow}</p>
            <h3 className="text-5xl font-semibold sm:text-6xl">{activeSlide.title}</h3>
            <p className="text-sm tracking-[0.3em] sm:text-base">{activeSlide.description}</p>
            <Link
              className="mt-2 border border-current bg-black/10 px-6 py-3 text-base font-medium backdrop-blur-sm transition-colors hover:bg-black/20"
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
