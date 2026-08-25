export type RecipeStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type RecipeOwnerRole = 'registered' | 'admin';
export type RecipeDishType = 'main' | 'dessert' | 'soup' | 'salad' | 'appetizer' | 'breakfast';
export type RecipeCuisine = 'bulgarian' | 'french' | 'asian' | 'italian' | 'mexican' | 'spanish' | 'turkish' | 'international';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
  complexity?: 'easy' | 'medium' | 'hard';
  dishType?: RecipeDishType;
  cuisine?: RecipeCuisine;
  ingredients?: string[];
  steps?: string[];
  photoUrls?: string[];
  status: RecipeStatus;
  reviewComment?: string;
  ownerId: string;
  ownerRole: RecipeOwnerRole;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
  complexity?: 'easy' | 'medium' | 'hard';
  dishType?: RecipeDishType;
  cuisine?: RecipeCuisine;
  ingredients?: string[];
  steps?: string[];
  photoUrls?: string[];
  status?: RecipeStatus;
  reviewComment?: string;
  ownerId?: string;
  ownerRole?: RecipeOwnerRole;
}

export interface UpdateRecipeInput extends CreateRecipeInput {
  id: string;
  reviewComment?: string;
  metaOnly?: boolean;
}
