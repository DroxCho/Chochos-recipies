import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })));
const RecipesPage = lazy(() => import('../pages/RecipesPage').then((module) => ({ default: module.RecipesPage })));
const AddRecipePage = lazy(() => import('../pages/AddRecipePage').then((module) => ({ default: module.AddRecipePage })));
const RecipeDetailsPage = lazy(() => import('../pages/RecipeDetailsPage').then((module) => ({ default: module.RecipeDetailsPage })));
const EditRecipePage = lazy(() => import('../pages/EditRecipePage').then((module) => ({ default: module.EditRecipePage })));

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
    ],
  },
]);
