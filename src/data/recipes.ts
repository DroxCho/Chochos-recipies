import type { Recipe } from '../types/recipe';

export const recipes: Recipe[] = [
  {
    id: 'shopska-salad',
    title: 'Shopska Salad',
    description: 'Tomatoes, cucumbers, peppers, onion, and sirene cheese.',
    prepMinutes: 15,
    servings: 2,
  },
  {
    id: 'banitsa',
    title: 'Banitsa',
    description: 'Layered filo pastry with eggs, yogurt, and white cheese.',
    prepMinutes: 50,
    servings: 6,
  },
  {
    id: 'tarator',
    title: 'Tarator',
    description: 'Cold yogurt soup with cucumber, dill, and garlic.',
    prepMinutes: 10,
    servings: 3,
  },
];

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id);
}
