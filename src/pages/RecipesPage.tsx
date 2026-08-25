import { RecipeForm } from '../components/recipes/RecipeForm';
import { RecipeList } from '../components/recipes/RecipeList';
import { useRecipes } from '../hooks/useRecipes';

export function RecipesPage() {
  const { recipes, isLoading, isCreating, error, createRecipe } = useRecipes();

  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Recipes</h2>

      <RecipeForm onCreate={createRecipe} isSubmitting={isCreating} />

      {isLoading && <p className="text-sm text-slate-500">Loading recipes...</p>}

      {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}

      {!isLoading && recipes.length === 0 && (
        <p className="text-sm text-slate-500">No recipes found.</p>
      )}

      <RecipeList recipes={recipes} />
    </section>
  );
}
