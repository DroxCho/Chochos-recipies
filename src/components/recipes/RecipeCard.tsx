import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/useLanguage';
import type { Recipe } from '../../types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { t } = useLanguage();

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{recipe.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{recipe.description}</p>
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span>{recipe.prepMinutes} {t('minutesShort')}</span>
        <span>{recipe.servings} {t('servingsShort')}</span>
      </div>
      <Link
        className="mt-4 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
        to={`/recipes/${recipe.id}`}
      >
        {t('viewDetails')}
      </Link>
    </article>
  );
}
