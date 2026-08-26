const RECIPE_RATINGS_KEY = 'recipe-ratings-by-user-v1';

type RecipeRatingMap = Record<string, Record<string, number>>;

function readRatingsMap(): RecipeRatingMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(RECIPE_RATINGS_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as RecipeRatingMap;
  } catch {
    return {};
  }
}

function writeRatingsMap(map: RecipeRatingMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_RATINGS_KEY, JSON.stringify(map));
}

function clampRating(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function getUserRecipeRating(
  userId: string | null | undefined,
  recipeId: string,
): number | null {
  if (!userId) {
    return null;
  }

  const map = readRatingsMap();
  const value = map[recipeId]?.[userId];
  return typeof value === 'number' ? clampRating(value) : null;
}

export function setUserRecipeRating(
  userId: string | null | undefined,
  recipeId: string,
  rating: number,
): void {
  if (!userId) {
    return;
  }

  const map = readRatingsMap();
  const recipeRatings = { ...(map[recipeId] ?? {}) };
  recipeRatings[userId] = clampRating(rating);
  map[recipeId] = recipeRatings;
  writeRatingsMap(map);
}

export function getRecipeAverageRating(recipeId: string): { average: number; count: number } {
  const map = readRatingsMap();
  const values = Object.values(map[recipeId] ?? {}).filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = values.reduce((sum, value) => sum + clampRating(value), 0);
  return {
    average: total / values.length,
    count: values.length,
  };
}
