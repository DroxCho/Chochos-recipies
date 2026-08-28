import { useCallback, useEffect, useState } from 'react';
import { canCreateRecipe, canViewRecipe } from '../auth/roles';
import { useUserRole } from '../auth/useUserRole';
import {
  deleteRecipeById,
  fetchRecipeById,
  fetchRecipes,
  insertRecipe,
  recipes as sampleRecipes,
  updateRecipe,
} from '../data/recipes';
import type { CreateRecipeInput, Recipe } from '../types/recipe';
import { useLanguage } from '../i18n/useLanguage';

function withFallbackTags(recipe: Recipe): Recipe {
  return {
    ...recipe,
    dishType: recipe.dishType ?? 'main',
    cuisine: recipe.cuisine ?? 'international',
  };
}

export function useRecipes() {
  const { t } = useLanguage();
  const { role, userId } = useUserRole();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyVisibility = useCallback(
    (allRecipes: Recipe[]): Recipe[] => {
      return allRecipes.filter((recipe) => canViewRecipe(role, recipe, userId));
    },
    [role, userId],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchRecipes();
        if (isMounted) {
          setRecipes(applyVisibility(data));
          setError(null);
        }
      } catch {
        if (isMounted) {
          setRecipes(applyVisibility(sampleRecipes.map(withFallbackTags)));
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
  }, [applyVisibility, t]);

  async function createRecipe(input: CreateRecipeInput) {
    if (!canCreateRecipe(role) || !userId) {
      setError(t('noAddRecipePermission'));
      throw new Error('Create recipe not allowed');
    }

    setIsCreating(true);
    try {
      const createdRecipe = await insertRecipe({
        ...input,
        ownerId: userId,
        ownerRole: role === 'admin' ? 'admin' : 'registered',
        status: role === 'admin' ? 'approved' : 'pending',
      });
      setRecipes((prev) => applyVisibility([createdRecipe, ...prev]));
      setError(null);
      return createdRecipe;
    } catch {
      setError(t('errorCreateRecipe'));
      throw new Error('Create recipe failed');
    } finally {
      setIsCreating(false);
    }
  }

  async function updateExistingRecipe(recipe: Recipe) {
    setIsUpdating(true);
    try {
      const updated = await updateRecipe({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        prepMinutes: recipe.prepMinutes,
        servings: recipe.servings,
        complexity: recipe.complexity,
        dishType: recipe.dishType,
        dishTypes: recipe.dishTypes,
        cuisine: recipe.cuisine,
        cuisines: recipe.cuisines,
        mainProduct: recipe.mainProduct,
        mainProducts: recipe.mainProducts,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        notes: recipe.notes,
        photoUrls: recipe.photoUrls,
        status: recipe.status,
        ownerId: recipe.ownerId,
        ownerRole: recipe.ownerRole,
      });

      setRecipes((prev) => applyVisibility(prev.map((item) => (item.id === updated.id ? updated : item))));
      setError(null);
      return updated;
    } catch {
      setError(t('errorCreateRecipe'));
      throw new Error('Update recipe failed');
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteExistingRecipe(id: string) {
    if (role !== 'admin') {
      setError(t('noAddRecipePermission'));
      throw new Error('Delete recipe not allowed');
    }

    setDeletingRecipeId(id);
    try {
      await deleteRecipeById(id);
      setRecipes((prev) => prev.filter((item) => item.id !== id));
      setError(null);
    } catch {
      setError(t('errorUpdateRecipe'));
      throw new Error('Delete recipe failed');
    } finally {
      setDeletingRecipeId(null);
    }
  }

  return {
    recipes,
    isLoading,
    isCreating,
    isUpdating,
    deletingRecipeId,
    error,
    createRecipe,
    updateExistingRecipe,
    deleteExistingRecipe,
  };
}

export function useRecipeDetails(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { role, userId } = useUserRole();

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
          if (data && canViewRecipe(role, data, userId)) {
            setRecipe(data);
            setError(null);
          } else {
            setRecipe(undefined);
            setError(t('recipeNotFound'));
          }
        }
      } catch {
        if (isMounted) {
          const fallback = sampleRecipes.find((item) => item.id === id);
          if (fallback && canViewRecipe(role, fallback, userId)) {
            setRecipe(withFallbackTags(fallback));
            setError(t('errorLoadRecipeDetails'));
          } else {
            setRecipe(undefined);
            setError(t('recipeNotFound'));
          }
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
  }, [id, role, t, userId]);

  return { recipe, isLoading, error };
}
