import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { CreateRecipeInput } from '../../types/recipe';

interface RecipeFormProps {
  onCreate: (input: CreateRecipeInput) => Promise<void>;
  isSubmitting: boolean;
}

export function RecipeForm({ onCreate, isSubmitting }: RecipeFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepMinutes, setPrepMinutes] = useState(15);
  const [servings, setServings] = useState(2);
  const [complexity, setComplexity] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [ingredients, setIngredients] = useState<string[]>(['', '', '']);
  const [steps, setSteps] = useState<string[]>(['', '', '']);
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  function updateListValue(
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
    value: string,
  ) {
    setter((current) => current.map((item, currentIndex) => (currentIndex === index ? value : item)));
  }

  function addListItem(setter: Dispatch<SetStateAction<string[]>>) {
    setter((current) => [...current, '']);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 2) {
      setError(t('validationTitleMin'));
      return;
    }

    if (trimmedDescription.length < 10) {
      setError(t('validationDescriptionMin'));
      return;
    }

    if (prepMinutes <= 0) {
      setError(t('validationPrepMin'));
      return;
    }

    if (servings <= 0) {
      setError(t('validationServingsMin'));
      return;
    }

    setError(null);

    try {
      await onCreate({
        title: trimmedTitle,
        description: trimmedDescription,
        prepMinutes,
        servings,
        complexity,
        ingredients: ingredients.map((item) => item.trim()).filter(Boolean),
        steps: steps.map((item) => item.trim()).filter(Boolean),
        photoUrls: photoUrls.map((item) => item.trim()).filter(Boolean),
      });
    } catch {
      setError(t('errorCreateRecipe'));
      return;
    }

    setTitle('');
    setDescription('');
    setPrepMinutes(15);
    setServings(2);
    setComplexity('medium');
    setIngredients(['', '', '']);
    setSteps(['', '', '']);
    setPhotoUrls(['']);
  }

  return (
    <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
      <h3 className="text-base font-semibold text-slate-900">{t('addRecipe')}</h3>

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          {t('title')}
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('titlePlaceholder')}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          {t('description')}
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('descriptionPlaceholder')}
          />
        </label>

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            {t('prepMinutes')}
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              value={prepMinutes}
              onChange={(event) => setPrepMinutes(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            {t('servings')}
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              value={servings}
              onChange={(event) => setServings(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            {t('complexity')}
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={complexity}
              onChange={(event) => setComplexity(event.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">{t('complexityEasy')}</option>
              <option value="medium">{t('complexityMedium')}</option>
              <option value="hard">{t('complexityHard')}</option>
            </select>
          </label>
        </div>

        <div className="sm:col-span-2">
          <h4 className="text-sm font-semibold text-slate-900">{t('ingredients')}</h4>
          <div className="mt-2 grid gap-2">
            {ingredients.map((ingredient, index) => (
              <label key={`ingredient-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                {t('ingredientItem')} {index + 1}
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  value={ingredient}
                  onChange={(event) => updateListValue(setIngredients, index, event.target.value)}
                  placeholder={t('ingredientPlaceholder')}
                />
              </label>
            ))}
          </div>
          <button
            className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            onClick={() => addListItem(setIngredients)}
            type="button"
          >
            {t('addIngredient')}
          </button>
        </div>

        <div className="sm:col-span-2">
          <h4 className="text-sm font-semibold text-slate-900">{t('steps')}</h4>
          <div className="mt-2 grid gap-2">
            {steps.map((step, index) => (
              <label key={`step-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                {t('stepItem')} {index + 1}
                <textarea
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2"
                  value={step}
                  onChange={(event) => updateListValue(setSteps, index, event.target.value)}
                  placeholder={t('stepPlaceholder')}
                />
              </label>
            ))}
          </div>
          <button
            className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            onClick={() => addListItem(setSteps)}
            type="button"
          >
            {t('addStep')}
          </button>
        </div>

        <div className="sm:col-span-2">
          <h4 className="text-sm font-semibold text-slate-900">{t('photos')}</h4>
          <div className="mt-2 grid gap-2">
            {photoUrls.map((photoUrl, index) => (
              <label key={`photo-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                {t('photoItem')} {index + 1}
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  value={photoUrl}
                  onChange={(event) => updateListValue(setPhotoUrls, index, event.target.value)}
                  placeholder={t('photoPlaceholder')}
                  type="url"
                />
              </label>
            ))}
          </div>
          <button
            className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            onClick={() => addListItem(setPhotoUrls)}
            type="button"
          >
            {t('addPhoto')}
          </button>
        </div>
      </div>

      <button
        className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t('saving') : t('createRecipe')}
      </button>
    </form>
  );
}
