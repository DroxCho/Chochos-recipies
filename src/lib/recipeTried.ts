const RECIPE_TRIED_BY_USER_KEY = 'recipes-tried-by-user-v1';

type TriedMap = Record<string, string[]>;

function readTriedMap(): TriedMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(RECIPE_TRIED_BY_USER_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as TriedMap;
  } catch {
    return {};
  }
}

function writeTriedMap(map: TriedMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_TRIED_BY_USER_KEY, JSON.stringify(map));
}

export function hasUserTriedRecipe(userId: string | null | undefined, recipeId: string): boolean {
  if (!userId) {
    return false;
  }

  const map = readTriedMap();
  return (map[userId] ?? []).includes(recipeId);
}

export function setUserTriedRecipe(userId: string | null | undefined, recipeId: string, tried: boolean): void {
  if (!userId) {
    return;
  }

  const map = readTriedMap();
  const current = new Set(map[userId] ?? []);

  if (tried) {
    current.add(recipeId);
  } else {
    current.delete(recipeId);
  }

  map[userId] = Array.from(current);
  writeTriedMap(map);
}
