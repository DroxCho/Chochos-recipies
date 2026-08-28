import { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { RouteErrorPage } from '../pages/RouteErrorPage';

function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  retryKey: string,
) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(retryKey);
      }

      return module;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const hasRetried = sessionStorage.getItem(retryKey) === '1';
        if (!hasRetried) {
          sessionStorage.setItem(retryKey, '1');
          window.location.reload();
        }
      }

      throw error;
    }
  });
}

const RecipesPage = lazyWithRetry(
  () => import('../pages/RecipesPage').then((module) => ({ default: module.RecipesPage })),
  'lazy-retry-recipes-page',
);
const FavoritesPage = lazyWithRetry(
  () => import('../pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })),
  'lazy-retry-favorites-page',
);
const AddRecipePage = lazyWithRetry(
  () => import('../pages/AddRecipePage').then((module) => ({ default: module.AddRecipePage })),
  'lazy-retry-add-recipe-page',
);
const RecipeDetailsPage = lazyWithRetry(
  () => import('../pages/RecipeDetailsPage').then((module) => ({ default: module.RecipeDetailsPage })),
  'lazy-retry-recipe-details-page',
);
const EditRecipePage = lazyWithRetry(
  () => import('../pages/EditRecipePage').then((module) => ({ default: module.EditRecipePage })),
  'lazy-retry-edit-recipe-page',
);
const ProfilePage = lazyWithRetry(
  () => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
  'lazy-retry-profile-page',
);
const UsersPage = lazyWithRetry(
  () => import('../pages/UsersPage').then((module) => ({ default: module.UsersPage })),
  'lazy-retry-users-page',
);

function LoadingFallback() {
  const { t } = useLanguage();
  return <p className="text-sm text-slate-500">{t('loadingGeneric')}</p>;
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      {
        path: 'recipes',
        element: withSuspense(<RecipesPage />),
      },
      {
        path: 'favorites',
        element: withSuspense(<FavoritesPage />),
      },
      {
        path: 'recipes/new',
        element: withSuspense(<AddRecipePage />),
      },
      {
        path: 'recipes/:id',
        element: withSuspense(<RecipeDetailsPage />),
      },
      {
        path: 'recipes/:id/edit',
        element: withSuspense(<EditRecipePage />),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />),
      },
      {
        path: 'users',
        element: withSuspense(<UsersPage />),
      },
    ],
  },
]);
