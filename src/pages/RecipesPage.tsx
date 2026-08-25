import { RecipeList } from '../components/recipes/RecipeList';
import { recipes } from '../data/recipes';

export function RecipesPage() {
  return (
    <section aria-label="recipes-page" className="min-h-[320px]">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Recipes</h2>
      <RecipeList recipes={recipes} />
    </section>
  );
}
