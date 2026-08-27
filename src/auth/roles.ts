import type { Recipe } from '../types/recipe';

export type UserRole = 'visitor' | 'registered' | 'admin' | 'blocked';

export function canParticipate(role: UserRole): boolean {
  return role === 'registered' || role === 'admin';
}

export function canViewFavorites(role: UserRole): boolean {
  return role === 'registered' || role === 'admin' || role === 'blocked';
}

export function canCreateRecipe(role: UserRole): boolean {
  return canParticipate(role);
}

export function canApproveRecipe(role: UserRole): boolean {
  return role === 'admin';
}

export function canEditRecipe(role: UserRole, recipe: Recipe, userId: string | null): boolean {
  if (role === 'admin') {
    return true;
  }

  if (canParticipate(role) && userId) {
    return recipe.ownerId === userId;
  }

  return false;
}

export function canViewRecipe(role: UserRole, recipe: Recipe, userId: string | null): boolean {
  if (role === 'admin') {
    return true;
  }

  if (recipe.status === 'approved') {
    return true;
  }

  if (canParticipate(role) && userId) {
    return recipe.ownerId === userId;
  }

  return false;
}
