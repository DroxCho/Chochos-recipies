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
  multiStep?: boolean;
}

export function RecipeForm({
  onCreate,
  isSubmitting,
  initialValues,
  submitLabelKey = 'createRecipe',
  resetOnSuccess = true,
  multiStep = false,
}: RecipeFormProps) {
  const { t } = useLanguage();
  const requiredMark = <span className="text-rose-600">*</span>;
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
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialValues?.photoUrls && initialValues.photoUrls.length > 0 ? initialValues.photoUrls : [''],
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = 5;

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

    const normalizedIngredients = ingredients.map((item) => item.trim()).filter(Boolean);
    const normalizedSteps = steps.map((item) => item.trim()).filter(Boolean);
    const normalizedNotes = notes.trim();
    const normalizedPhotoUrls = photoUrls.map((item) => item.trim());

    function validateStepOne(): boolean {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      if (!trimmedTitle) {
        setError(t('validationRequiredField'));
        return false;
      }

      if (trimmedTitle.length < 2) {
        setError(t('validationTitleMin'));
        return false;
      }

      if (!trimmedDescription) {
        setError(t('validationRequiredField'));
        return false;
      }

      if (trimmedDescription.length < 10) {
        setError(t('validationDescriptionMin'));
        return false;
      }

      if (prepMinutes <= 0) {
        setError(t('validationPrepMin'));
        return false;
      }

      if (servings <= 0) {
        setError(t('validationServingsMin'));
        return false;
      }

      if (!complexity) {
        setError(t('validationComplexityRequired'));
        return false;
      }

      if (!dishType || !cuisine) {
        setError(t('validationTagsRequired'));
        return false;
      }

      return true;
    }

    function validateStepTwo(): boolean {
      const firstIngredient = ingredients[0]?.trim() ?? '';
      if (!firstIngredient) {
        setError(t('validationIngredientsRequired'));
        return false;
      }

      return true;
    }

    function validateStepThree(): boolean {
      const firstStep = steps[0]?.trim() ?? '';
      if (!firstStep) {
        setError(t('validationStepsRequired'));
        return false;
      }

      return true;
    }

    function validateStepFour(): boolean {
      return true;
    }

    function validateStepFive(): boolean {
      if (normalizedPhotoUrls.some((item) => item.length === 0)) {
        setError(t('validationPhotosRequired'));
        return false;
      }

      if (normalizedPhotoUrls.some((item) => !isValidHttpUrl(item))) {
        setError(t('validationPhotosUrl'));
        return false;
      }

      return true;
    }

    function validateStep(step: number): boolean {
      if (step === 1) {
        return validateStepOne();
      }

      if (step === 2) {
        return validateStepTwo();
      }

      if (step === 3) {
        return validateStepThree();
      }

      if (step === 4) {
        return validateStepFour();
      }

      return validateStepFive();
    }

    if (multiStep && currentStep < totalSteps) {
      if (!validateStep(currentStep)) {
        return;
      }

      setError(null);
      setCurrentStep((step) => Math.min(totalSteps, step + 1));
      return;
    }

    if (!validateStepOne()) {
      if (multiStep) {
        setCurrentStep(1);
      }
      return;
    }

    if (!validateStepTwo()) {
      if (multiStep) {
        setCurrentStep(2);
      }
      return;
    }

    if (!validateStepThree()) {
      if (multiStep) {
        setCurrentStep(3);
      }
      return;
    }

    if (!validateStepFour()) {
      if (multiStep) {
        setCurrentStep(4);
      }
      return;
    }

    if (!validateStepFive()) {
      if (multiStep) {
        setCurrentStep(5);
      }
      return;
    }

    setError(null);

    const finalComplexity = complexity as 'easy' | 'medium' | 'hard';
    const finalDishType = dishType as RecipeDishType;
    const finalCuisine = cuisine as RecipeCuisine;

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        prepMinutes,
        servings,
        complexity: finalComplexity,
        dishType: finalDishType,
        cuisine: finalCuisine,
        ingredients: normalizedIngredients,
        steps: normalizedSteps,
        notes: normalizedNotes,
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
      setNotes('');
      setPhotoUrls(['']);
      setCurrentStep(1);
    }
  }

  return (
    <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4" noValidate onSubmit={handleSubmit}>
      {!multiStep && <h3 className="text-base font-semibold text-slate-900">{t('addRecipe')}</h3>}

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {multiStep && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('wizardStepLabel')} {currentStep}/{totalSteps}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {currentStep === 1
              ? t('wizardStep1')
              : currentStep === 2
              ? t('wizardStep2')
              : currentStep === 3
              ? t('wizardStep3')
              : currentStep === 4
              ? t('wizardStep4')
              : t('wizardStep5')}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(!multiStep || currentStep === 1) && (
          <>
            <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          <span>{t('title')} {requiredMark}</span>
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('titlePlaceholder')}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          <span>{t('description')} {requiredMark}</span>
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('descriptionPlaceholder')}
            required
          />
        </label>

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('dishType')} {requiredMark}</span>
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
            <span>{t('cuisineType')} {requiredMark}</span>
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

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('prepMinutes')} {requiredMark}</span>
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
            <span>{t('servings')} {requiredMark}</span>
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
            <span>{t('complexity')} {requiredMark}</span>
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
          </>
        )}

        {(!multiStep || currentStep === 2) && (
          <div className="sm:col-span-2">
          {!multiStep && <h4 className="text-sm font-semibold text-slate-900">{t('ingredients')} {requiredMark}</h4>}
          <div className="mt-2 grid gap-2">
            {ingredients.map((ingredient, index) => (
              <label key={`ingredient-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  {t('ingredientItem')} {index + 1} {index === 0 ? requiredMark : null}
                </span>
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  value={ingredient}
                  onChange={(event) => updateListValue(setIngredients, index, event.target.value)}
                  placeholder={t('ingredientPlaceholder')}
                  required={index === 0}
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
        )}

        {(!multiStep || currentStep === 3) && (
          <div className="sm:col-span-2">
          {!multiStep && <h4 className="text-sm font-semibold text-slate-900">{t('steps')} {requiredMark}</h4>}
          <div className="mt-2 grid gap-2">
            {steps.map((step, index) => (
              <label key={`step-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  {t('stepItem')} {index + 1} {index === 0 ? requiredMark : null}
                </span>
                <textarea
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2"
                  value={step}
                  onChange={(event) => updateListValue(setSteps, index, event.target.value)}
                  placeholder={t('stepPlaceholder')}
                  required={index === 0}
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
        )}

        {(!multiStep || currentStep === 4) && (
          <div className="sm:col-span-2">
            {!multiStep && <h4 className="text-sm font-semibold text-slate-900">{t('additionalNotes')}</h4>}
            <div className="mt-2 grid gap-2">
              <textarea
                className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t('additionalNotesPlaceholder')}
                value={notes}
              />
            </div>
          </div>
        )}

        {(!multiStep || currentStep === 5) && (
          <div className="sm:col-span-2">
          {!multiStep && <h4 className="text-sm font-semibold text-slate-900">{t('photos')} {requiredMark}</h4>}
          <div className="mt-2 grid gap-2">
            {photoUrls.map((photoUrl, index) => (
              <label key={`photo-${index}`} className="flex flex-col gap-1 text-sm text-slate-700">
                <span>{t('photoItem')} {index + 1} {requiredMark}</span>
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
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {multiStep && currentStep > 1 && (
          <button
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            onClick={() => {
              setError(null);
              setCurrentStep((step) => Math.max(1, step - 1));
            }}
            type="button"
          >
            {t('wizardBack')}
          </button>
        )}

        <button
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? t('saving') : multiStep && currentStep < totalSteps ? t('wizardNext') : t(submitLabelKey)}
        </button>
      </div>
    </form>
  );
}
