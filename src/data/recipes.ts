import type { CreateRecipeInput, Recipe, RecipeOwnerRole, RecipeStatus, UpdateRecipeInput } from '../types/recipe';
import { hasSupabaseAnonKey, supabase } from '../lib/supabase';

export const recipes: Recipe[] = [
  {
    id: 'shopska-salad',
    title: 'Shopska Salad',
    description: 'Tomatoes, cucumbers, peppers, onion, and sirene cheese.',
    prepMinutes: 15,
    servings: 2,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'banitsa',
    title: 'Banitsa',
    description: 'Layered filo pastry with eggs, yogurt, and white cheese.',
    prepMinutes: 50,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'tarator',
    title: 'Tarator',
    description: 'Cold yogurt soup with cucumber, dill, and garlic.',
    prepMinutes: 10,
    servings: 3,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
];

const RECIPE_META_KEY = 'recipes_meta_v1';

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id);
}

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  prep_minutes: number | null;
  servings: number | null;
}

interface RecipeMeta {
  status: RecipeStatus;
  ownerId: string;
  ownerRole: RecipeOwnerRole;
  complexity?: 'easy' | 'medium' | 'hard';
  ingredients?: string[];
  steps?: string[];
  photoUrls?: string[];
}

type RecipeMetaMap = Record<string, RecipeMeta>;

function normalizeRecipeId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildRecipeId(title: string): string {
  const base = normalizeRecipeId(title);
  const fallback = `recipe-${Date.now()}`;
  return base.length > 0 ? `${base}-${Date.now()}` : fallback;
}

function normalizeStringList(items: string[] | undefined): string[] | undefined {
  const normalized = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function readRecipeMetaMap(): RecipeMetaMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(RECIPE_META_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as RecipeMetaMap;
  } catch {
    return {};
  }
}

function writeRecipeMetaMap(map: RecipeMetaMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_META_KEY, JSON.stringify(map));
}

function getDefaultRecipeMeta(): RecipeMeta {
  return {
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  };
}

function applyMeta(recipe: Recipe, map: RecipeMetaMap): Recipe {
  const meta = map[recipe.id] ?? getDefaultRecipeMeta();

  return {
    ...recipe,
    status: meta.status,
    ownerId: meta.ownerId,
    ownerRole: meta.ownerRole,
    complexity: meta.complexity,
    ingredients: normalizeStringList(meta.ingredients),
    steps: normalizeStringList(meta.steps),
    photoUrls: normalizeStringList(meta.photoUrls),
  };
}

function persistRecipeMeta(id: string, patch: Partial<RecipeMeta>): RecipeMeta {
  const map = readRecipeMetaMap();
  const current = map[id] ?? getDefaultRecipeMeta();

  const next: RecipeMeta = {
    ...current,
    ...patch,
    ingredients: normalizeStringList(patch.ingredients ?? current.ingredients),
    steps: normalizeStringList(patch.steps ?? current.steps),
    photoUrls: normalizeStringList(patch.photoUrls ?? current.photoUrls),
  };

  map[id] = next;
  writeRecipeMetaMap(map);
  return next;
}

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    prepMinutes: row.prep_minutes ?? 0,
    servings: row.servings ?? 0,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const metaMap = readRecipeMetaMap();

  if (!hasSupabaseAnonKey) {
    return recipes.map((recipe) => applyMeta(recipe, metaMap));
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,description,prep_minutes,servings')
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return recipes.map((recipe) => applyMeta(recipe, metaMap));
  }

  return (data as RecipeRow[]).map((row) => applyMeta(mapRecipeRow(row), metaMap));
}

export async function fetchRecipeById(id: string): Promise<Recipe | undefined> {
  const metaMap = readRecipeMetaMap();

  if (!hasSupabaseAnonKey) {
    const fallbackRecipe = getRecipeById(id);
    return fallbackRecipe ? applyMeta(fallbackRecipe, metaMap) : undefined;
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,description,prep_minutes,servings')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const fallbackRecipe = getRecipeById(id);
    return fallbackRecipe ? applyMeta(fallbackRecipe, metaMap) : undefined;
  }

  return applyMeta(mapRecipeRow(data as RecipeRow), metaMap);
}

export async function insertRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const id = buildRecipeId(input.title);

  const payload = {
    id,
    title: input.title,
    description: input.description,
    prep_minutes: input.prepMinutes,
    servings: input.servings,
  };

  const metaPatch: Partial<RecipeMeta> = {
    status: input.status ?? 'approved',
    ownerId: input.ownerId ?? 'admin-user-1',
    ownerRole: input.ownerRole ?? 'admin',
    complexity: input.complexity,
    ingredients: input.ingredients,
    steps: input.steps,
    photoUrls: input.photoUrls,
  };

  if (!hasSupabaseAnonKey) {
    const createdRecipe: Recipe = {
      id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: 'approved',
      ownerId: 'admin-user-1',
      ownerRole: 'admin',
    };

    persistRecipeMeta(id, metaPatch);
    return applyMeta(createdRecipe, readRecipeMetaMap());
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert(payload)
    .select('id,title,description,prep_minutes,servings')
    .single();

  if (error) {
    throw error;
  }

  persistRecipeMeta(id, metaPatch);
  return applyMeta(mapRecipeRow(data as RecipeRow), readRecipeMetaMap());
}

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
  const payload = {
    title: input.title,
    description: input.description,
    prep_minutes: input.prepMinutes,
    servings: input.servings,
  };

  const metaPatch: Partial<RecipeMeta> = {
    status: input.status,
    ownerId: input.ownerId,
    ownerRole: input.ownerRole,
    complexity: input.complexity,
    ingredients: input.ingredients,
    steps: input.steps,
    photoUrls: input.photoUrls,
  };

  if (!hasSupabaseAnonKey) {
    const fallback = getRecipeById(input.id);
    const updatedFallback: Recipe = {
      id: input.id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: fallback?.status ?? 'approved',
      ownerId: fallback?.ownerId ?? 'admin-user-1',
      ownerRole: fallback?.ownerRole ?? 'admin',
    };

    persistRecipeMeta(input.id, metaPatch);
    return applyMeta(updatedFallback, readRecipeMetaMap());
  }

  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', input.id)
    .select('id,title,description,prep_minutes,servings')
    .single();

  if (error) {
    throw error;
  }

  persistRecipeMeta(input.id, metaPatch);
  return applyMeta(mapRecipeRow(data as RecipeRow), readRecipeMetaMap());
}
