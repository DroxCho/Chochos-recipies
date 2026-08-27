import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import { MainLayout } from '../layouts/MainLayout';
import { RouteErrorPage } from '../pages/RouteErrorPage';

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })));
const RecipesPage = lazy(() => import('../pages/RecipesPage').then((module) => ({ default: module.RecipesPage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const AddRecipePage = lazy(() => import('../pages/AddRecipePage').then((module) => ({ default: module.AddRecipePage })));
const RecipeDetailsPage = lazy(() => import('../pages/RecipeDetailsPage').then((module) => ({ default: module.RecipeDetailsPage })));
const EditRecipePage = lazy(() => import('../pages/EditRecipePage').then((module) => ({ default: module.EditRecipePage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const UsersPage = lazy(() => import('../pages/UsersPage').then((module) => ({ default: module.UsersPage })));

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
