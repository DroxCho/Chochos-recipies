const RECIPE_FAVORITES_BY_USER_KEY = 'recipes-favorites-by-user-v1';

type FavoritesMap = Record<string, string[]>;

function readFavoritesMap(): FavoritesMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(RECIPE_FAVORITES_BY_USER_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as FavoritesMap;
  } catch {
    return {};
  }
}

function writeFavoritesMap(map: FavoritesMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_FAVORITES_BY_USER_KEY, JSON.stringify(map));
}

export function hasUserFavoritedRecipe(userId: string | null | undefined, recipeId: string): boolean {
  if (!userId) {
    return false;
  }

  const map = readFavoritesMap();
  return (map[userId] ?? []).includes(recipeId);
}

export function setUserRecipeFavorite(
  userId: string | null | undefined,
  recipeId: string,
  isFavorite: boolean,
): void {
  if (!userId) {
    return;
  }

  const map = readFavoritesMap();
  const current = new Set(map[userId] ?? []);

  if (isFavorite) {
    current.add(recipeId);
  } else {
    current.delete(recipeId);
  }

  map[userId] = Array.from(current);
  writeFavoritesMap(map);
}
