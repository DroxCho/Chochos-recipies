export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  prepMinutes: number;
  servings: number;
}
