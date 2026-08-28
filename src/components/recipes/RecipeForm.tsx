import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { CreateRecipeInput } from '../../types/recipe';
import type { TranslationKey } from '../../i18n/translations';
import type { RecipeCuisine, RecipeDishType } from '../../types/recipe';
import { getMainProductMeta } from '../../lib/mainProduct';

type ComplexityValue = '' | 'easy' | 'medium' | 'hard';
type DishTypeValue = '' | RecipeDishType;
type CuisineValue = '' | RecipeCuisine;
type MainProductValue =
  | ''
  | 'agneshko-meso'
  | 'bebeshki-hrani'
  | 'bob'
  | 'divech'
  | 'zele'
  | 'zelenchuci'
  | 'zaeshko-meso'
  | 'karantiya'
  | 'leshta'
  | 'mlechni-produkti'
  | 'morski-darove'
  | 'pateshko-meso'
  | 'pileshko-meso'
  | 'plodove'
  | 'pueshko-meso'
  | 'riba'
  | 'oriz'
  | 'svinsko-meso'
  | 'sladoled'
  | 'soleni-pechiva'
  | 'teleshko-meso'
  | 'yastiya-s-yaitsa';

const MAIN_PRODUCT_VALUES: MainProductValue[] = [
  'agneshko-meso',
  'bebeshki-hrani',
  'bob',
  'divech',
  'zele',
  'zelenchuci',
  'zaeshko-meso',
  'karantiya',
  'leshta',
  'mlechni-produkti',
  'morski-darove',
  'pateshko-meso',
  'pileshko-meso',
  'plodove',
  'pueshko-meso',
  'riba',
  'oriz',
  'svinsko-meso',
  'sladoled',
  'soleni-pechiva',
  'teleshko-meso',
  'yastiya-s-yaitsa',
];
type FieldErrorMap = Partial<Record<string, TranslationKey>>;

const PHOTO_EDITOR_PREVIEW_SIZE = 288;

interface RecipeFormProps {
  onCreate: (input: CreateRecipeInput) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: Partial<CreateRecipeInput>;
  submitLabelKey?: TranslationKey;
  submitErrorKey?: TranslationKey;
  resetOnSuccess?: boolean;
  multiStep?: boolean;
  onTitleChange?: (title: string) => void;
}

export function RecipeForm({
  onCreate,
  isSubmitting,
  initialValues,
  submitLabelKey = 'createRecipe',
  submitErrorKey = 'errorCreateRecipe',
  resetOnSuccess = true,
  multiStep = false,
  onTitleChange,
}: RecipeFormProps) {
  const { t, language } = useLanguage();
  const requiredMark = <span className="text-rose-600">*</span>;
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [prepMinutes, setPrepMinutes] = useState(initialValues?.prepMinutes ?? 15);
  const [servings, setServings] = useState(initialValues?.servings ?? 2);
  const [complexity, setComplexity] = useState<ComplexityValue>(initialValues?.complexity ?? '');
  const [dishType, setDishType] = useState<DishTypeValue>(initialValues?.dishType ?? '');
  const [cuisine, setCuisine] = useState<CuisineValue>(initialValues?.cuisine ?? '');
  const [mainProducts, setMainProducts] = useState<MainProductValue[]>(() => {
    const fromList = (initialValues?.mainProducts ?? []).filter(
      (value): value is MainProductValue => MAIN_PRODUCT_VALUES.includes(value as MainProductValue),
    );

    if (fromList.length > 0) {
      return [...new Set(fromList)];
    }

    const single = initialValues?.mainProduct;
    return single && MAIN_PRODUCT_VALUES.includes(single as MainProductValue)
      ? [single as MainProductValue]
      : [];
  });
  const [selectedComplexityStars, setSelectedComplexityStars] = useState(complexityToStars(initialValues?.complexity ?? ''));
  const [ingredients, setIngredients] = useState<string[]>(
    initialValues?.ingredients && initialValues.ingredients.length > 0 ? initialValues.ingredients : [''],
  );
  const [steps, setSteps] = useState<string[]>(
    initialValues?.steps && initialValues.steps.length > 0 ? initialValues.steps : [''],
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialValues?.photoUrls && initialValues.photoUrls.length > 0 ? [initialValues.photoUrls[0] ?? ''] : [''],
  );
  const [photoOriginalUrl, setPhotoOriginalUrl] = useState(
    initialValues?.photoOriginalUrl?.trim() || initialValues?.photoUrls?.[0]?.trim() || '',
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isMainProductMenuOpen, setIsMainProductMenuOpen] = useState(false);
  const [editorSourceUrl, setEditorSourceUrl] = useState('');
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorNaturalSize, setEditorNaturalSize] = useState({ width: 0, height: 0 });
  const [editorImageSize, setEditorImageSize] = useState({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
  const [selectionSquare, setSelectionSquare] = useState({ x: 0, y: 0, size: 0 });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isApplyingPhotoEdit, setIsApplyingPhotoEdit] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const previousEditorZoomRef = useRef(1);
  const editorPreviewRef = useRef<HTMLDivElement | null>(null);
  const mainProductMenuRef = useRef<HTMLDivElement | null>(null);
  const totalSteps = 5;
  const wizardStepLabels: TranslationKey[] = ['wizardStep1', 'wizardStep2', 'wizardStep3', 'wizardStep4', 'wizardStep5'];
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const isProgressComplete = progressPercent >= 100;
  const hasEmptyIngredientField = ingredients.some((item) => item.trim().length === 0);
  const hasEmptyStepField = steps.some((item) => item.trim().length === 0);
  const canAddIngredientInput = !hasEmptyIngredientField;
  const canAddStepInput = !hasEmptyStepField;

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

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function inputBorderClass(hasError: boolean): string {
    return hasError ? 'border-rose-500' : 'border-slate-300';
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));

    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }

    return x || 1;
  }

  function getAspectRatioLabel(): string {
    const width = editorImageSize.width;
    const height = editorImageSize.height;

    if (!width || !height) {
      return '-';
    }

    const divisor = gcd(width, height);

    return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
  }

  function getImageRenderRect(width: number, height: number, zoomValue: number = 1) {
    if (!width || !height) {
      return { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 };
    }

    const previewSize = editorPreviewRef.current?.clientWidth || PHOTO_EDITOR_PREVIEW_SIZE;
    const baseScale = Math.min(previewSize / width, previewSize / height);
    const scale = baseScale * clamp(zoomValue, 1, 3);
    const renderedWidth = width * scale;
    const renderedHeight = height * scale;

    return {
      width: renderedWidth,
      height: renderedHeight,
      scale,
      offsetX: (previewSize - renderedWidth) / 2,
      offsetY: (previewSize - renderedHeight) / 2,
    };
  }

  function initializeSelectionFromImage(width: number, height: number, zoomValue: number = editorZoom) {
    const rect = getImageRenderRect(width, height, zoomValue);
    const size = Math.min(200, rect.width, rect.height);

    setEditorImageSize(rect);
    setSelectionSquare({
      size,
      x: rect.offsetX + (rect.width - size) / 2,
      y: rect.offsetY + (rect.height - size) / 2,
    });
  }

  function clampSelectionPosition(x: number, y: number, size: number = selectionSquare.size) {
    const minX = editorImageSize.offsetX;
    const minY = editorImageSize.offsetY;
    const maxX = editorImageSize.offsetX + editorImageSize.width - size;
    const maxY = editorImageSize.offsetY + editorImageSize.height - size;

    return {
      x: clamp(x, minX, Math.max(minX, maxX)),
      y: clamp(y, minY, Math.max(minY, maxY)),
    };
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

  function isValidPhotoSource(value: string): boolean {
    const trimmed = value.trim();

    if (!trimmed) {
      return false;
    }

    if (trimmed.startsWith('data:image/')) {
      return true;
    }

    return isValidHttpUrl(trimmed);
  }

  function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      if (source.startsWith('http')) {
        image.crossOrigin = 'anonymous';
      }

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('photo-load-failed'));
      image.src = source;
    });
  }

  async function optimizeImageDataUrl(source: string, maxSide: number = 1600, quality: number = 0.88): Promise<string> {
    if (!source.startsWith('data:image/')) {
      return source;
    }

    const image = await loadImage(source);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const longestSide = Math.max(width, height);

    if (!longestSide || longestSide <= maxSide) {
      return source;
    }

    const scale = maxSide / longestSide;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('photo-canvas-failed');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL('image/jpeg', quality);
  }

  async function createSquareImage(
    source: string,
    selectionX: number,
    selectionY: number,
    selectionSize: number,
    zoomValue: number,
  ): Promise<string> {
    const image = await loadImage(source);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const renderRect = getImageRenderRect(width, height, zoomValue);
    const srcX = (selectionX - renderRect.offsetX) / renderRect.scale;
    const srcY = (selectionY - renderRect.offsetY) / renderRect.scale;
    const srcSize = selectionSize / renderRect.scale;

    const canvas = document.createElement('canvas');
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('photo-canvas-failed');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputSize, outputSize);
    context.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  async function applyPhotoEdits() {
    const source = editorSourceUrl.trim();

    if (!source) {
      setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotosRequired' }));
      return;
    }

    if (selectionSquare.size <= 0) {
      return;
    }

    setIsApplyingPhotoEdit(true);

    try {
      const nextPhoto = await createSquareImage(
        source,
        selectionSquare.x,
        selectionSquare.y,
        selectionSquare.size,
        editorZoom,
      );
      setPhotoUrls([nextPhoto]);
      clearFieldError('photo-0');
      setIsPhotoEditorOpen(false);
    } catch {
      setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotoProcessFailed' }));
    } finally {
      setIsApplyingPhotoEdit(false);
    }
  }

  function openPhotoEditor() {
    const source = (photoOriginalUrl || photoUrls[0] || '').trim();

    if (!source) {
      setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotosRequired' }));
      return;
    }

    setEditorSourceUrl(source);
    if (!photoOriginalUrl.trim() && source) {
      setPhotoOriginalUrl(source);
    }
    setEditorZoom(1);
    previousEditorZoomRef.current = 1;
    setEditorNaturalSize({ width: 0, height: 0 });
    setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
    setSelectionSquare({ x: 0, y: 0, size: 0 });
    setIsPhotoEditorOpen(true);
  }

  function handleEditorWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const zoomStep = 0.1;
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = clamp(Number((editorZoom + direction * zoomStep).toFixed(2)), 1, 3);

    if (nextZoom !== editorZoom) {
      setEditorZoom(nextZoom);
    }
  }

  function startCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startX: selectionSquare.x,
      startY: selectionSquare.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingSelection(true);
  }

  function moveCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSelection || !dragStartRef.current) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    const next = clampSelectionPosition(dragStartRef.current.startX + deltaX, dragStartRef.current.startY + deltaY);
    setSelectionSquare((current) => ({ ...current, x: next.x, y: next.y }));
  }

  function endCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    setIsDraggingSelection(false);
  }

  function handlePhotoFileSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotosUrl' }));
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : '';

      if (!result) {
        setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotoUploadFailed' }));
        return;
      }

      try {
        const optimizedOriginal = await optimizeImageDataUrl(result);
        setPhotoUrls([optimizedOriginal]);
        setPhotoOriginalUrl(optimizedOriginal);
        setEditorSourceUrl(optimizedOriginal);
        setEditorZoom(1);
        previousEditorZoomRef.current = 1;
        setEditorNaturalSize({ width: 0, height: 0 });
        setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
        setSelectionSquare({ x: 0, y: 0, size: 0 });
        setIsPhotoEditorOpen(true);
        clearFieldError('photo-0');
      } catch {
        setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotoProcessFailed' }));
      }
    };

    reader.onerror = () => {
      setFieldErrors((current) => ({ ...current, 'photo-0': 'validationPhotoUploadFailed' }));
    };

    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!isPhotoEditorOpen || selectionSquare.size <= 0) {
      return;
    }

    const next = clampSelectionPosition(selectionSquare.x, selectionSquare.y);
    if (next.x !== selectionSquare.x || next.y !== selectionSquare.y) {
      setSelectionSquare((current) => ({ ...current, x: next.x, y: next.y }));
    }
  }, [isPhotoEditorOpen, editorImageSize.width, editorImageSize.height, selectionSquare.size]);

  useEffect(() => {
    if (!isPhotoEditorOpen || !editorNaturalSize.width || !editorNaturalSize.height) {
      return;
    }

    const previousZoom = previousEditorZoomRef.current;

    if (selectionSquare.size <= 0) {
      initializeSelectionFromImage(editorNaturalSize.width, editorNaturalSize.height, editorZoom);
      previousEditorZoomRef.current = editorZoom;
      return;
    }

    const previousRect = getImageRenderRect(editorNaturalSize.width, editorNaturalSize.height, previousZoom);
    const nextRect = getImageRenderRect(editorNaturalSize.width, editorNaturalSize.height, editorZoom);
    const centerX = selectionSquare.x + selectionSquare.size / 2;
    const centerY = selectionSquare.y + selectionSquare.size / 2;
    const sourceCenterX = (centerX - previousRect.offsetX) / previousRect.scale;
    const sourceCenterY = (centerY - previousRect.offsetY) / previousRect.scale;
    const nextCenterX = nextRect.offsetX + sourceCenterX * nextRect.scale;
    const nextCenterY = nextRect.offsetY + sourceCenterY * nextRect.scale;
    const nextX = nextCenterX - selectionSquare.size / 2;
    const nextY = nextCenterY - selectionSquare.size / 2;
    const minX = nextRect.offsetX;
    const minY = nextRect.offsetY;
    const maxX = nextRect.offsetX + nextRect.width - selectionSquare.size;
    const maxY = nextRect.offsetY + nextRect.height - selectionSquare.size;

    setEditorImageSize(nextRect);
    setSelectionSquare((current) => ({
      ...current,
      x: clamp(nextX, minX, Math.max(minX, maxX)),
      y: clamp(nextY, minY, Math.max(minY, maxY)),
    }));
    previousEditorZoomRef.current = editorZoom;
  }, [editorZoom, isPhotoEditorOpen, editorNaturalSize.width, editorNaturalSize.height]);

  useEffect(() => {
    onTitleChange?.(title.trim());
  }, [title, onTitleChange]);

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

  const mainProductOptions: Array<{ value: Exclude<MainProductValue, ''>; label: string }> = [
    { value: 'agneshko-meso', label: 'Агнешко месо' },
    { value: 'bebeshki-hrani', label: 'Бебешки храни' },
    { value: 'bob', label: 'Боб' },
    { value: 'divech', label: 'Дивеч' },
    { value: 'zele', label: 'Зеле' },
    { value: 'zelenchuci', label: 'Зеленчуци' },
    { value: 'zaeshko-meso', label: 'Заешко месо' },
    { value: 'karantiya', label: 'Карантия' },
    { value: 'leshta', label: 'Леща' },
    { value: 'mlechni-produkti', label: 'Млечни продукти и заместители' },
    { value: 'morski-darove', label: 'Морски дарове' },
    { value: 'pateshko-meso', label: 'Патешко месо' },
    { value: 'pileshko-meso', label: 'Пилешко месо' },
    { value: 'plodove', label: 'Плодове' },
    { value: 'pueshko-meso', label: 'Пуешко месо' },
    { value: 'riba', label: 'Риба' },
    { value: 'oriz', label: 'Ориз' },
    { value: 'svinsko-meso', label: 'Свинско месо' },
    { value: 'sladoled', label: 'Сладолед' },
    { value: 'soleni-pechiva', label: 'Солени печива' },
    { value: 'teleshko-meso', label: 'Телешко месо' },
    { value: 'yastiya-s-yaitsa', label: 'Ястия с яйца' },
  ];

  const selectedMainProductLabel =
    mainProducts.length === 0
      ? ''
      : mainProducts.length === 1
      ? (getMainProductMeta(mainProducts[0], language)?.label ?? '')
      : `${mainProducts.length} ${t('selectedItems')}`;

  useEffect(() => {
    if (!isMainProductMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!mainProductMenuRef.current?.contains(event.target as Node)) {
        setIsMainProductMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMainProductMenuOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIngredients = ingredients.map((item) => item.trim()).filter(Boolean);
    const normalizedSteps = steps.map((item) => item.trim()).filter(Boolean);
    const normalizedNotes = notes.trim();
    const normalizedPhotoUrls = photoUrls.map((item) => item.trim());

    function validateStepOne(): FieldErrorMap {
      const nextErrors: FieldErrorMap = {};
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      if (!trimmedTitle) {
        nextErrors.title = 'validationRequiredField';
      } else if (trimmedTitle.length < 2) {
        nextErrors.title = 'validationTitleMin';
      }

      if (!trimmedDescription) {
        nextErrors.description = 'validationRequiredField';
      } else if (trimmedDescription.length < 10) {
        nextErrors.description = 'validationDescriptionMin';
      }

      if (prepMinutes <= 0) {
        nextErrors.prepMinutes = 'validationPrepMin';
      }

      if (servings <= 0) {
        nextErrors.servings = 'validationServingsMin';
      }

      if (!complexity) {
        nextErrors.complexity = 'validationComplexityRequired';
      }

      if (!dishType) {
        nextErrors.dishType = 'validationTagsRequired';
      }

      if (!cuisine) {
        nextErrors.cuisine = 'validationTagsRequired';
      }

      if (mainProducts.length === 0) {
        nextErrors.mainProduct = 'validationTagsRequired';
      }

      return nextErrors;
    }

    function validateStepTwo(): FieldErrorMap {
      const nextErrors: FieldErrorMap = {};
      const firstIngredient = ingredients[0]?.trim() ?? '';
      if (!firstIngredient) {
        nextErrors['ingredient-0'] = 'validationIngredientsRequired';
      }

      return nextErrors;
    }

    function validateStepThree(): FieldErrorMap {
      const nextErrors: FieldErrorMap = {};
      const firstStep = steps[0]?.trim() ?? '';
      if (!firstStep) {
        nextErrors['step-0'] = 'validationStepsRequired';
      }

      return nextErrors;
    }

    function validateStepFour(): FieldErrorMap {
      return {};
    }

    function validateStepFive(): FieldErrorMap {
      const nextErrors: FieldErrorMap = {};
      const firstPhoto = normalizedPhotoUrls[0] ?? '';
      if (!firstPhoto) {
        nextErrors['photo-0'] = 'validationPhotosRequired';
      } else if (!isValidPhotoSource(firstPhoto)) {
        nextErrors['photo-0'] = 'validationPhotosUrl';
      }

      return nextErrors;
    }

    function validateStep(step: number): FieldErrorMap {
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

    function hasValidationErrors(errors: FieldErrorMap): boolean {
      return Object.keys(errors).length > 0;
    }

    if (multiStep && currentStep < totalSteps) {
      const stepErrors = validateStep(currentStep);
      if (hasValidationErrors(stepErrors)) {
        setError(null);
        setFieldErrors(stepErrors);
        return;
      }

      setFieldErrors({});
      setError(null);
      setCurrentStep((step) => Math.min(totalSteps, step + 1));
      return;
    }

    const stepOneErrors = validateStepOne();
    const stepTwoErrors = validateStepTwo();
    const stepThreeErrors = validateStepThree();
    const stepFourErrors = validateStepFour();
    const stepFiveErrors = validateStepFive();
    const allErrors: FieldErrorMap = {
      ...stepOneErrors,
      ...stepTwoErrors,
      ...stepThreeErrors,
      ...stepFourErrors,
      ...stepFiveErrors,
    };

    if (hasValidationErrors(allErrors)) {
      setError(null);
      setFieldErrors(allErrors);

      if (multiStep) {
        if (hasValidationErrors(stepOneErrors)) {
          setCurrentStep(1);
        } else if (hasValidationErrors(stepTwoErrors)) {
          setCurrentStep(2);
        } else if (hasValidationErrors(stepThreeErrors)) {
          setCurrentStep(3);
        } else if (hasValidationErrors(stepFourErrors)) {
          setCurrentStep(4);
        } else {
          setCurrentStep(5);
        }
      }

      return;
    }

    setFieldErrors({});
    setError(null);

    const finalComplexity = complexity as 'easy' | 'medium' | 'hard';
    const finalDishType = dishType as RecipeDishType;
    const finalCuisine = cuisine as RecipeCuisine;
    const finalMainProducts = [...mainProducts];
    const finalMainProduct = finalMainProducts[0];
    const photoOriginalCandidate = photoOriginalUrl.trim() || normalizedPhotoUrls[0] || '';

    try {
      const normalizedPhotoOriginal = photoOriginalCandidate.startsWith('data:image/')
        ? await optimizeImageDataUrl(photoOriginalCandidate)
        : photoOriginalCandidate;

      await onCreate({
        title: title.trim(),
        description: description.trim(),
        prepMinutes,
        servings,
        complexity: finalComplexity,
        dishType: finalDishType,
        cuisine: finalCuisine,
        mainProduct: finalMainProduct,
        mainProducts: finalMainProducts,
        ingredients: normalizedIngredients,
        steps: normalizedSteps,
        notes: normalizedNotes,
        photoUrls: [normalizedPhotoUrls[0] ?? ''],
        photoOriginalUrl: normalizedPhotoOriginal || undefined,
      });
    } catch {
      setError(t(submitErrorKey));
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
      setMainProducts([]);
      setSelectedComplexityStars(0);
      setIngredients(['']);
      setSteps(['']);
      setNotes('');
      setPhotoUrls(['']);
      setPhotoOriginalUrl('');
      setEditorSourceUrl('');
      setEditorZoom(1);
      setEditorNaturalSize({ width: 0, height: 0 });
      setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
      setSelectionSquare({ x: 0, y: 0, size: 0 });
      setCurrentStep(1);
    }
  }

  return (
    <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4" noValidate onSubmit={handleSubmit}>
      {!multiStep && <h3 className="text-base font-semibold text-slate-900">{t('addRecipe')}</h3>}

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {multiStep && (
        <div className="mt-4 border-b border-slate-200 pb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('wizardStepLabel')} {currentStep}/{totalSteps}
            </p>
            <p className="text-xs font-medium text-slate-500">{Math.round(progressPercent)}%</p>
          </div>

          <div className="mx-12">
            <div className="relative h-10">
              <div
                aria-label="Wizard progress"
                className="absolute top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200"
                style={{ left: `calc(50% / ${totalSteps})`, right: `calc(50% / ${totalSteps})` }}
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-valuenow={currentStep}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isProgressComplete ? 'bg-emerald-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <ol className="pointer-events-none relative grid h-full grid-cols-5 items-center">
                {wizardStepLabels.map((stepLabel, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;

                  return (
                    <li key={`wizard-progress-dot-${stepLabel}`} className="flex justify-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full border font-semibold transition-all duration-200 ${
                          isCurrent ? 'h-10 w-10 text-base' : 'h-6 w-6 text-xs'
                        } ${
                          isCurrent
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : isCompleted
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        {stepNumber}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <ol className="mt-6 grid grid-cols-5">
              {wizardStepLabels.map((stepLabel, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;

                return (
                  <li key={`wizard-progress-label-${stepLabel}`} className="flex justify-center">
                    <span
                      className={`${
                        isCurrent
                          ? 'text-base font-semibold text-orange-600'
                          : isCompleted
                          ? 'text-xs font-medium text-emerald-700'
                          : 'text-xs text-slate-600'
                      } block w-24 whitespace-normal text-center leading-tight`}
                    >
                      {t(stepLabel)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(!multiStep || currentStep === 1) && (
          <>
            <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          <span>{t('title')} {requiredMark}</span>
          <input
            className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.title))}`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearFieldError('title');
            }}
            placeholder={t('titlePlaceholder')}
            required
          />
          {fieldErrors.title && <span className="text-xs text-rose-700">{t(fieldErrors.title)}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          <span>{t('description')} {requiredMark}</span>
          <textarea
            className={`min-h-24 rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.description))}`}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearFieldError('description');
            }}
            placeholder={t('descriptionPlaceholder')}
            required
          />
          {fieldErrors.description && <span className="text-xs text-rose-700">{t(fieldErrors.description)}</span>}
        </label>

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('dishType')} {requiredMark}</span>
            <select
              className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.dishType))}`}
              onChange={(event) => {
                setDishType(event.target.value as DishTypeValue);
                clearFieldError('dishType');
              }}
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
            {fieldErrors.dishType && <span className="text-xs text-rose-700">{t(fieldErrors.dishType)}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('cuisineType')} {requiredMark}</span>
            <select
              className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.cuisine))}`}
              onChange={(event) => {
                setCuisine(event.target.value as CuisineValue);
                clearFieldError('cuisine');
              }}
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
            {fieldErrors.cuisine && <span className="text-xs text-rose-700">{t(fieldErrors.cuisine)}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('mainIngredient')} {requiredMark}</span>
            <div className="relative" ref={mainProductMenuRef}>
              <button
                className={`w-full rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-700 ${inputBorderClass(Boolean(fieldErrors.mainProduct))}`}
                onClick={() => setIsMainProductMenuOpen((open) => !open)}
                type="button"
              >
                {selectedMainProductLabel || t('selectMainProduct')}
              </button>

              {isMainProductMenuOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {mainProductOptions.map((option) => {
                      const checked = mainProducts.includes(option.value);
                      const optionMeta = getMainProductMeta(option.value, language);
                      const icon = optionMeta?.icon ?? '•';
                      const localizedLabel = optionMeta?.label ?? option.label;

                      return (
                        <label key={`main-product-form-${option.value}`} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                          <span aria-hidden="true" className="text-base leading-none">{icon}</span>
                          <input
                            checked={checked}
                            onChange={() => {
                              setMainProducts((current) =>
                                current.includes(option.value)
                                  ? current.filter((value) => value !== option.value)
                                  : [...current, option.value],
                              );
                              clearFieldError('mainProduct');
                            }}
                            type="checkbox"
                          />
                          <span>{localizedLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                    <button
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                      onClick={() => {
                        setMainProducts([]);
                        clearFieldError('mainProduct');
                      }}
                      type="button"
                    >
                      {t('clearSelection')}
                    </button>
                    <button
                      className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
                      onClick={() => setIsMainProductMenuOpen(false)}
                      type="button"
                    >
                      {t('done')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {fieldErrors.mainProduct && <span className="text-xs text-rose-700">{t(fieldErrors.mainProduct)}</span>}
          </label>
        </div>

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('prepMinutes')} {requiredMark}</span>
            <input
              className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.prepMinutes))}`}
              type="number"
              min={1}
              value={prepMinutes}
              onChange={(event) => {
                setPrepMinutes(Number(event.target.value));
                clearFieldError('prepMinutes');
              }}
              required
            />
            {fieldErrors.prepMinutes && <span className="text-xs text-rose-700">{t(fieldErrors.prepMinutes)}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>{t('servings')} {requiredMark}</span>
            <input
              className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.servings))}`}
              type="number"
              min={1}
              value={servings}
              onChange={(event) => {
                setServings(Number(event.target.value));
                clearFieldError('servings');
              }}
              required
            />
            {fieldErrors.servings && <span className="text-xs text-rose-700">{t(fieldErrors.servings)}</span>}
          </label>

          <div className={`flex flex-col gap-1 text-sm ${fieldErrors.complexity ? 'text-rose-700' : 'text-slate-700'}`}>
            <span>{t('complexity')} {requiredMark}</span>
            <div
              className={`flex w-full items-center justify-center gap-1 rounded-md border px-2 py-1 ${inputBorderClass(Boolean(fieldErrors.complexity))}`}
              role="group"
              aria-label={t('complexity')}
            >
              {[1, 2, 3, 4, 5].map((stars) => {
                const selected = selectedComplexityStars >= stars;

                return (
                  <button
                    key={`complexity-star-${stars}`}
                    aria-label={`${t('complexity')} ${stars}`}
                    className={`instant-tooltip text-2xl leading-none ${selected ? 'text-amber-400' : 'text-slate-300'}`}
                    onClick={() => {
                      setSelectedComplexityStars(stars);
                      setComplexity(resolveComplexityFromStars(stars));
                      clearFieldError('complexity');
                    }}
                    data-tooltip={`${t('complexity')} ${stars}`}
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
            {fieldErrors.complexity && <span className="text-xs text-rose-700">{t(fieldErrors.complexity)}</span>}
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
                  className={`rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors[`ingredient-${index}`]))}`}
                  value={ingredient}
                  onChange={(event) => {
                    updateListValue(setIngredients, index, event.target.value);
                    clearFieldError(`ingredient-${index}`);
                  }}
                  placeholder={t('ingredientPlaceholder')}
                  required={index === 0}
                />
                {fieldErrors[`ingredient-${index}`] && (
                  <span className="text-xs text-rose-700">{t(fieldErrors[`ingredient-${index}`] as TranslationKey)}</span>
                )}
              </label>
            ))}
          </div>
          <button
            className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => addListItem(setIngredients)}
            type="button"
            disabled={!canAddIngredientInput}
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
                  className={`min-h-20 rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors[`step-${index}`]))}`}
                  value={step}
                  onChange={(event) => {
                    updateListValue(setSteps, index, event.target.value);
                    clearFieldError(`step-${index}`);
                  }}
                  placeholder={t('stepPlaceholder')}
                  required={index === 0}
                />
                {fieldErrors[`step-${index}`] && (
                  <span className="text-xs text-rose-700">{t(fieldErrors[`step-${index}`] as TranslationKey)}</span>
                )}
              </label>
            ))}
          </div>
          <button
            className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => addListItem(setSteps)}
            type="button"
            disabled={!canAddStepInput}
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
                <span>
                  {t('photoItem')} {index + 1} {index === 0 ? requiredMark : null}
                </span>
                {photoUrl.trim().length > 0 && isValidPhotoSource(photoUrl) && (
                  <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{t('photoSquarePreview')}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          className="h-48 w-48 overflow-hidden rounded-md border border-slate-300 bg-white"
                          onClick={() => {
                            if (index === 0) {
                              openPhotoEditor();
                            }
                          }}
                          aria-label={t('openPhotoEditor')}
                        >
                          <img
                            src={photoUrl}
                            alt={`${t('photoItem')} ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      {index === 0 && (
                        <button
                          type="button"
                          aria-label={t('removePhoto')}
                          className="inline-flex h-8 w-8 items-center justify-center self-center rounded-full border border-rose-300 bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600"
                          onClick={() => {
                            setPhotoUrls(['']);
                            setPhotoOriginalUrl('');
                            setEditorSourceUrl('');
                            setEditorZoom(1);
                            setEditorNaturalSize({ width: 0, height: 0 });
                            setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
                            setSelectionSquare({ x: 0, y: 0, size: 0 });
                            setIsPhotoEditorOpen(false);
                            clearFieldError('photo-0');
                          }}
                        >
                          x
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                        onClick={() => openPhotoEditor()}
                      >
                        {t('openPhotoEditor')}
                      </button>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className={`w-full rounded-md border px-3 py-2 ${inputBorderClass(Boolean(fieldErrors[`photo-${index}`]))}`}
                    value={photoUrl}
                    onChange={(event) => {
                      updateListValue(setPhotoUrls, index, event.target.value);
                      if (index === 0) {
                        setPhotoOriginalUrl(event.target.value);
                        setEditorSourceUrl(event.target.value);
                      }
                      clearFieldError(`photo-${index}`);
                    }}
                    placeholder={t('photoPlaceholder')}
                    type="text"
                    required={index === 0}
                  />
                  {index === 0 && (
                    <label
                      htmlFor="photo-upload-input"
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                      {t('uploadPhoto')}
                    </label>
                  )}
                </div>
                {index === 0 && (
                  <div className="flex items-center gap-3">
                    <input
                      id="photo-upload-input"
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        handlePhotoFileSelect(event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                      }}
                    />
                    <span className="text-xs text-slate-500">{t('uploadPhotoHint')}</span>
                  </div>
                )}
                {fieldErrors[`photo-${index}`] && (
                  <span className="text-xs text-rose-700">{t(fieldErrors[`photo-${index}`] as TranslationKey)}</span>
                )}
              </label>
            ))}
          </div>
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

      {isPhotoEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">{t('photoEditorTitle')}</h4>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsPhotoEditorOpen(false)}
              >
                {t('cancel')}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[320px,1fr]">
                <div
                  ref={editorPreviewRef}
                  className="relative mx-auto h-[min(68vw,18rem)] w-[min(68vw,18rem)] overflow-hidden rounded-lg border border-slate-300 bg-slate-100 sm:h-72 sm:w-72"
                  onWheel={handleEditorWheel}
                >
                <img
                  src={editorSourceUrl}
                  alt={t('photoItem')}
                  className="h-full w-full select-none object-contain"
                  draggable={false}
                  onLoad={(event) => {
                    const width = event.currentTarget.naturalWidth;
                    const height = event.currentTarget.naturalHeight;
                    setEditorNaturalSize({ width, height });
                    initializeSelectionFromImage(width, height, editorZoom);
                  }}
                  style={{ transform: `scale(${editorZoom})` }}
                />
                {selectionSquare.size > 0 && (
                  <div
                    className={`absolute border-2 border-orange-500 bg-orange-500/10 ${
                      isDraggingSelection ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{
                      left: `${selectionSquare.x}px`,
                      top: `${selectionSquare.y}px`,
                      width: `${selectionSquare.size}px`,
                      height: `${selectionSquare.size}px`,
                    }}
                    onPointerDown={(event) => startCropDrag(event)}
                    onPointerMove={(event) => moveCropDrag(event)}
                    onPointerUp={(event) => endCropDrag(event)}
                    onPointerCancel={(event) => endCropDrag(event)}
                  >
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold leading-none text-orange-700">
                      +
                    </span>
                    <span className="absolute -bottom-5 left-0 text-[10px] font-medium text-orange-700">{t('photoCropAreaLabel')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600">{t('photoDragHint')}</p>
                <p className="text-xs text-slate-600">{t('photoAspectRatioLabel')}: {getAspectRatioLabel()}</p>
                <p className="text-xs text-slate-500">{t('photoSquareLockHint')}</p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={() => {
                      void applyPhotoEdits();
                    }}
                    disabled={isApplyingPhotoEdit}
                  >
                    {isApplyingPhotoEdit ? t('photoProcessing') : t('applyPhotoEdits')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                    onClick={() => setIsPhotoEditorOpen(false)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
