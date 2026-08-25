import { Link, useParams } from 'react-router-dom';
import { getRecipeById } from '../data/recipes';

export function RecipeDetailsPage() {
  const { id } = useParams();

  if (!id) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">Missing recipe id.</p>
      </section>
    );
  }

  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Recipe not found</h2>
        <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to="/recipes">
          Back to recipes
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-slate-900">{recipe.title}</h2>
      <p className="mt-3 text-sm text-slate-600">{recipe.description}</p>
      <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
        <span>Prep: {recipe.prepMinutes} min</span>
        <span>Servings: {recipe.servings}</span>
      </div>
      <Link className="mt-6 inline-flex text-sm text-slate-700 underline" to="/recipes">
        Back to recipes
      </Link>
    </section>
  );
}
