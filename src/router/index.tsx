import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AddRecipePage } from '../pages/AddRecipePage';
import { EditRecipePage } from '../pages/EditRecipePage';
import { HomePage } from '../pages/HomePage';
import { RecipeDetailsPage } from '../pages/RecipeDetailsPage';
import { RecipesPage } from '../pages/RecipesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'recipes',
        element: <RecipesPage />,
      },
      {
        path: 'recipes/new',
        element: <AddRecipePage />,
      },
      {
        path: 'recipes/:id',
        element: <RecipeDetailsPage />,
      },
      {
        path: 'recipes/:id/edit',
        element: <EditRecipePage />,
      },
    ],
  },
]);
