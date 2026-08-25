import { useState } from 'react';
import type { FormEvent } from 'react';
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
  const [error, setError] = useState<string | null>(null);

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
      });
    } catch {
      setError(t('errorCreateRecipe'));
      return;
    }

    setTitle('');
    setDescription('');
    setPrepMinutes(15);
    setServings(2);
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
