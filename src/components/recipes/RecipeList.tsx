import type { Recipe } from '../../types/recipe';
import { RecipeCard } from './RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  deletingRecipeId?: string | null;
  onDeleteRecipe?: (id: string) => Promise<void>;
}

export function RecipeList({ recipes, deletingRecipeId, onDeleteRecipe }: RecipeListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard
          isDeleting={deletingRecipeId === recipe.id}
          key={recipe.id}
          onDelete={onDeleteRecipe}
          recipe={recipe}
        />
      ))}
    </div>
  );
}
