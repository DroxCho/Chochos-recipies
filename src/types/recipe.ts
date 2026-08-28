export type RecipeStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type RecipeOwnerRole = 'registered' | 'admin';
export type RecipeDishType = 'main' | 'dessert' | 'soup' | 'salad' | 'appetizer' | 'breakfast';
export type RecipeCuisine =
  | 'bulgarian'
  | 'french'
  | 'asian'
  | 'italian'
  | 'mexican'
  | 'spanish'
  | 'turkish'
  | 'vegan'
  | 'vegetarian'
  | 'international';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
  complexity?: 'easy' | 'medium' | 'hard';
  dishType?: RecipeDishType;
  dishTypes?: RecipeDishType[];
  cuisine?: RecipeCuisine;
  cuisines?: RecipeCuisine[];
  mainProduct?: string;
  mainProducts?: string[];
  ingredients?: string[];
  steps?: string[];
  notes?: string;
  photoUrls?: string[];
  photoOriginalUrl?: string;
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
  dishTypes?: RecipeDishType[];
  cuisine?: RecipeCuisine;
  cuisines?: RecipeCuisine[];
  mainProduct?: string;
  mainProducts?: string[];
  ingredients?: string[];
  steps?: string[];
  notes?: string;
  photoUrls?: string[];
  photoOriginalUrl?: string;
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
