import type { CreateRecipeInput, Recipe } from '../types/recipe';
import { hasSupabaseAnonKey, supabase } from '../lib/supabase';

export const recipes: Recipe[] = [
  {
    id: 'shopska-salad',
    title: 'Shopska Salad',
    description: 'Tomatoes, cucumbers, peppers, onion, and sirene cheese.',
    prepMinutes: 15,
    servings: 2,
  },
  {
    id: 'banitsa',
    title: 'Banitsa',
    description: 'Layered filo pastry with eggs, yogurt, and white cheese.',
    prepMinutes: 50,
    servings: 6,
  },
  {
    id: 'tarator',
    title: 'Tarator',
    description: 'Cold yogurt soup with cucumber, dill, and garlic.',
    prepMinutes: 10,
    servings: 3,
  },
];

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

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    prepMinutes: row.prep_minutes ?? 0,
    servings: row.servings ?? 0,
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  if (!hasSupabaseAnonKey) {
    return recipes;
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,description,prep_minutes,servings')
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return recipes;
  }

  return (data as RecipeRow[]).map(mapRecipeRow);
}

export async function fetchRecipeById(id: string): Promise<Recipe | undefined> {
  if (!hasSupabaseAnonKey) {
    return getRecipeById(id);
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
    return getRecipeById(id);
  }

  return mapRecipeRow(data as RecipeRow);
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

  if (!hasSupabaseAnonKey) {
    return {
      id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
    };
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert(payload)
    .select('id,title,description,prep_minutes,servings')
    .single();

  if (error) {
    throw error;
  }

  return mapRecipeRow(data as RecipeRow);
}
