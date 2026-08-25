import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { CreateRecipeInput } from '../../types/recipe';
import type { TranslationKey } from '../../i18n/translations';
import type { RecipeCuisine, RecipeDishType } from '../../types/recipe';

type ComplexityValue = '' | 'easy' | 'medium' | 'hard';
type DishTypeValue = '' | RecipeDishType;
type CuisineValue = '' | RecipeCuisine;

interface RecipeFormProps {
  onCreate: (input: CreateRecipeInput) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: Partial<CreateRecipeInput>;
  submitLabelKey?: TranslationKey;
  resetOnSuccess?: boolean;
}

export function RecipeForm({
  onCreate,
  isSubmitting,
  initialValues,
  submitLabelKey = 'createRecipe',
  resetOnSuccess = true,
}: RecipeFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [prepMinutes, setPrepMinutes] = useState(initialValues?.prepMinutes ?? 15);
  const [servings, setServings] = useState(initialValues?.servings ?? 2);
  const [complexity, setComplexity] = useState<ComplexityValue>(initialValues?.complexity ?? '');
  const [dishType, setDishType] = useState<DishTypeValue>(initialValues?.dishType ?? '');
  const [cuisine, setCuisine] = useState<CuisineValue>(initialValues?.cuisine ?? '');
  const [selectedComplexityStars, setSelectedComplexityStars] = useState(complexityToStars(initialValues?.complexity ?? ''));
  const [ingredients, setIngredients] = useState<string[]>(
    initialValues?.ingredients && initialValues.ingredients.length > 0 ? initialValues.ingredients : ['', '', ''],
  );
  const [steps, setSteps] = useState<string[]>(
    initialValues?.steps && initialValues.steps.length > 0 ? initialValues.steps : ['', '', ''],
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialValues?.photoUrls && initialValues.photoUrls.length > 0 ? initialValues.photoUrls : [''],
  );
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

  function resolveComplexityFromStars(stars: number): ComplexityValue {
    if (stars <= 2) {
      return 'easy';
    }

    if (stars === 3) {
      return 'medium';
    }

    return 'hard';
  }

  function complexityToStars(value: ComplexityValue): number {
    if (value === 'easy') {
      return 2;
    }

    if (value === 'medium') {
      return 3;
    }

    if (value === 'hard') {
      return 5;
    }

    return 0;
  }

  function isValidHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function complexityLabelByStars(stars: number): TranslationKey {
    if (stars === 1) {
      return 'complexityStar1';
    }

    if (stars === 2) {
      return 'complexityStar2';
    }

    if (stars === 3) {
      return 'complexityStar3';
    }

    if (stars === 4) {
      return 'complexityStar4';
    }

    if (stars === 5) {
      return 'complexityStar5';
    }

    return 'complexityRequiredHint';
  }

  const dishTypeOptions: Array<{ value: RecipeDishType; label: TranslationKey }> = [
    { value: 'main', label: 'dishTypeMain' },
    { value: 'dessert', label: 'dishTypeDessert' },
    { value: 'soup', label: 'dishTypeSoup' },
    { value: 'salad', label: 'dishTypeSalad' },
    { value: 'appetizer', label: 'dishTypeAppetizer' },
    { value: 'breakfast', label: 'dishTypeBreakfast' },
  ];

  const cuisineOptions: Array<{ value: RecipeCuisine; label: TranslationKey }> = [
    { value: 'bulgarian', label: 'cuisineBulgarian' },
    { value: 'french', label: 'cuisineFrench' },
    { value: 'asian', label: 'cuisineAsian' },
    { value: 'italian', label: 'cuisineItalian' },
    { value: 'mexican', label: 'cuisineMexican' },
    { value: 'spanish', label: 'cuisineSpanish' },
    { value: 'turkish', label: 'cuisineTurkish' },
    { value: 'vegan', label: 'cuisineVegan' },
    { value: 'vegetarian', label: 'cuisineVegetarian' },
    { value: 'international', label: 'cuisineInternational' },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError(t('validationRequiredField'));
      return;
    }

    if (trimmedTitle.length < 2) {
      setError(t('validationTitleMin'));
      return;
    }

    if (!trimmedDescription) {
      setError(t('validationRequiredField'));
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

    if (!complexity) {
      setError(t('validationComplexityRequired'));
      return;
    }

    if (!dishType || !cuisine) {
      setError(t('validationTagsRequired'));
      return;
    }

    const normalizedIngredients = ingredients.map((item) => item.trim());
    if (normalizedIngredients.some((item) => item.length === 0)) {
      setError(t('validationIngredientsRequired'));
      return;
    }

    const normalizedSteps = steps.map((item) => item.trim());
    if (normalizedSteps.some((item) => item.length === 0)) {
      setError(t('validationStepsRequired'));
      return;
    }

    const normalizedPhotoUrls = photoUrls.map((item) => item.trim());
    if (normalizedPhotoUrls.some((item) => item.length === 0)) {
      setError(t('validationPhotosRequired'));
      return;
    }

    if (normalizedPhotoUrls.some((item) => !isValidHttpUrl(item))) {
      setError(t('validationPhotosUrl'));
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
        dishType,
        cuisine,
        ingredients: normalizedIngredients,
        steps: normalizedSteps,
        photoUrls: normalizedPhotoUrls,
      });
    } catch {
      setError(t('errorCreateRecipe'));
      return;
    }

    if (resetOnSuccess) {
      setTitle('');
      setDescription('');
      setPrepMinutes(15);
      setServings(2);
      setComplexity('');
      setDishType('');
      setCuisine('');
      setSelectedComplexityStars(0);
      setIngredients(['', '', '']);
      setSteps(['', '', '']);
      setPhotoUrls(['']);
    }
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
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          {t('description')}
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('descriptionPlaceholder')}
            required
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
              required
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
              required
            />
          </label>

          <div className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('complexity')}</span>
            <div className="flex items-center gap-1" role="group" aria-label={t('complexity')}>
              {[1, 2, 3, 4, 5].map((stars) => {
                const selected = selectedComplexityStars >= stars;

                return (
                  <button
                    key={`complexity-star-${stars}`}
                    aria-label={`${t('complexity')} ${stars}`}
                    className={`text-2xl leading-none ${selected ? 'text-amber-400' : 'text-slate-300'}`}
                    onClick={() => {
                      setSelectedComplexityStars(stars);
                      setComplexity(resolveComplexityFromStars(stars));
                    }}
                    type="button"
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-slate-500">
              {t(complexityLabelByStars(selectedComplexityStars))}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            {t('dishType')}
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => setDishType(event.target.value as DishTypeValue)}
              required
              value={dishType}
            >
              <option value="">{t('selectDishType')}</option>
              {dishTypeOptions.map((option) => (
                <option key={`dish-type-${option.value}`} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            {t('cuisineType')}
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => setCuisine(event.target.value as CuisineValue)}
              required
              value={cuisine}
            >
              <option value="">{t('selectCuisineType')}</option>
              {cuisineOptions.map((option) => (
                <option key={`cuisine-type-${option.value}`} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
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
                  required
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
                  required
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
                  required
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
        {isSubmitting ? t('saving') : t(submitLabelKey)}
      </button>
    </form>
  );
}
