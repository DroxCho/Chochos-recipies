import type { Language } from './translations';
import type { Recipe } from '../types/recipe';

interface LocalizedRecipeContent {
  title: string;
  description: string;
}

const localizedRecipeContentById: Record<string, Record<Language, LocalizedRecipeContent>> = {
  'shopska-salad': {
    bg: {
      title: 'Шопска салата',
      description: 'Домати, краставици, чушки, лук и настъргано сирене.',
    },
    en: {
      title: 'Shopska Salad',
      description: 'Tomatoes, cucumbers, peppers, onion, and sirene cheese.',
    },
  },
  banitsa: {
    bg: {
      title: 'Баница',
      description: 'Редени кори с яйца, кисело мляко и бяло сирене.',
    },
    en: {
      title: 'Banitsa',
      description: 'Layered filo pastry with eggs, yogurt, and white cheese.',
    },
  },
  tarator: {
    bg: {
      title: 'Таратор',
      description: 'Студена супа с кисело мляко, краставица, копър и чесън.',
    },
    en: {
      title: 'Tarator',
      description: 'Cold yogurt soup with cucumber, dill, and garlic.',
    },
  },
};

export function getLocalizedRecipe(recipe: Recipe, language: Language): Recipe {
  const localized = localizedRecipeContentById[recipe.id]?.[language];

  if (!localized) {
    return recipe;
  }

  return {
    ...recipe,
    title: localized.title,
    description: localized.description,
  };
}
