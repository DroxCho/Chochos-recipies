import { useEffect, useState } from 'react';
import {
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
  recipes as sampleRecipes,
} from '../data/recipes';
import type { CreateRecipeInput, Recipe } from '../types/recipe';
import { useLanguage } from '../i18n/useLanguage';

export function useRecipes() {
  const { t } = useLanguage();
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
          setError(t('errorLoadRecipes'));
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
  }, [t]);

  async function createRecipe(input: CreateRecipeInput) {
    setIsCreating(true);
    try {
      const createdRecipe = await insertRecipe(input);
      setRecipes((prev) => [createdRecipe, ...prev]);
      setError(null);
      return createdRecipe;
    } catch {
      setError(t('errorCreateRecipe'));
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
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!id) {
        setRecipe(undefined);
        setError(t('errorMissingRecipeId'));
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
          setError(t('errorLoadRecipeDetails'));
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
  }, [id, t]);

  return { recipe, isLoading, error };
}
