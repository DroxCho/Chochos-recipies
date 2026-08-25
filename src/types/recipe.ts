export type RecipeStatus = 'pending' | 'approved';
export type RecipeOwnerRole = 'registered' | 'admin';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
  complexity?: 'easy' | 'medium' | 'hard';
  ingredients?: string[];
  steps?: string[];
  photoUrls?: string[];
  status: RecipeStatus;
  ownerId: string;
  ownerRole: RecipeOwnerRole;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
  complexity?: 'easy' | 'medium' | 'hard';
  ingredients?: string[];
  steps?: string[];
  photoUrls?: string[];
  status?: RecipeStatus;
  ownerId?: string;
  ownerRole?: RecipeOwnerRole;
}

export interface UpdateRecipeInput extends CreateRecipeInput {
  id: string;
}
