import { useEffect, useState } from 'react';
import {
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
  recipes as sampleRecipes,
} from '../data/recipes';
import type { CreateRecipeInput, Recipe } from '../types/recipe';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchRecipes();
        if (isMounted) {
          setRecipes(data);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setRecipes(sampleRecipes);
          setError('Could not load recipes from Supabase. Showing sample recipes.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function createRecipe(input: CreateRecipeInput) {
    setIsCreating(true);
    try {
      const createdRecipe = await insertRecipe(input);
      setRecipes((prev) => [createdRecipe, ...prev]);
      setError(null);
    } catch {
      setError('Could not create recipe. Please try again.');
      throw new Error('Create recipe failed');
    } finally {
      setIsCreating(false);
    }
  }

  return { recipes, isLoading, isCreating, error, createRecipe };
}

export function useRecipeDetails(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!id) {
        setRecipe(undefined);
        setError('Missing recipe id.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchRecipeById(id);
        if (isMounted) {
          setRecipe(data);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setRecipe(sampleRecipes.find((item) => item.id === id));
          setError('Could not load recipe details from Supabase.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { recipe, isLoading, error };
}
