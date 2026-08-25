import { useEffect, useState } from 'react';
import { fetchRecipeById, fetchRecipes, recipes as sampleRecipes } from '../data/recipes';
import type { Recipe } from '../types/recipe';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return { recipes, isLoading, error };
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
