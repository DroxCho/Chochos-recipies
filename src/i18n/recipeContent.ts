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
  kunefe: {
    bg: {
      title: 'Кюнефе',
      description: 'Хрупкав кадаиф с разтопено сирене и ароматен сироп.',
    },
    en: {
      title: 'Kunefe',
      description: 'Crispy kadaif pastry with melted cheese and fragrant syrup.',
    },
  },
  musaka: {
    bg: {
      title: 'Мусака',
      description: 'Печени пластове картофи и кайма със заливка.',
    },
    en: {
      title: 'Musaka',
      description: 'Layered potatoes, minced meat and creamy topping baked until golden.',
    },
  },
  sarmi: {
    bg: {
      title: 'Сарми',
      description: 'Лозови или зелеви сарми с ориз и кайма.',
    },
    en: {
      title: 'Sarmi',
      description: 'Vine or cabbage leaves stuffed with rice and minced meat.',
    },
  },
  kavarma: {
    bg: {
      title: 'Кавърма',
      description: 'Бавно готвено месо с лук, чушки и домати.',
    },
    en: {
      title: 'Kavarma',
      description: 'Slow-cooked pork with onions, peppers and tomatoes.',
    },
  },
  'bob-chorba': {
    bg: {
      title: 'Боб чорба',
      description: 'Традиционна българска бобена супа с подправки.',
    },
    en: {
      title: 'Bob Chorba',
      description: 'Traditional Bulgarian bean soup with herbs.',
    },
  },
  gyuvech: {
    bg: {
      title: 'Гювеч',
      description: 'Печена яхния с месо и сезонни зеленчуци.',
    },
    en: {
      title: 'Gyuvech',
      description: 'Oven-baked vegetable and meat stew.',
    },
  },
  kebapcheta: {
    bg: {
      title: 'Кебапчета',
      description: 'Сочни кебапчета на скара с кимион и пипер.',
    },
    en: {
      title: 'Kebapcheta',
      description: 'Grilled minced meat rolls seasoned with cumin and pepper.',
    },
  },
  kyufteta: {
    bg: {
      title: 'Кюфтета',
      description: 'Домашни кюфтета на скара с ароматни подправки.',
    },
    en: {
      title: 'Kyufteta',
      description: 'Juicy grilled meatballs with onion and spices.',
    },
  },
  'shopski-kebap': {
    bg: {
      title: 'Шопски кебап',
      description: 'Свинско със зеленчуци и вино по шопски.',
    },
    en: {
      title: 'Shopski Kebap',
      description: 'Pork stew with vegetables and white wine.',
    },
  },
  banichki: {
    bg: {
      title: 'Банички',
      description: 'Малки банички с плънка от сирене и яйца.',
    },
    en: {
      title: 'Banichki',
      description: 'Mini pastry rolls with sirene cheese filling.',
    },
  },
  tikvenik: {
    bg: {
      title: 'Тиквеник',
      description: 'Сладка баница с тиква, канела и орехи.',
    },
    en: {
      title: 'Tikvenik',
      description: 'Sweet pumpkin pastry with cinnamon and walnuts.',
    },
  },
  palachinki: {
    bg: {
      title: 'Палачинки',
      description: 'Тънки палачинки с плънка по избор.',
    },
    en: {
      title: 'Palachinki',
      description: 'Thin crepes served with jam, honey or chocolate.',
    },
  },
  mekitsi: {
    bg: {
      title: 'Мекици',
      description: 'Пухкави пържени мекици за закуска.',
    },
    en: {
      title: 'Mekitsi',
      description: 'Fried fluffy dough served with powdered sugar or sirene.',
    },
  },
  'sirene-po-shopski': {
    bg: {
      title: 'Сирене по шопски',
      description: 'Печено сирене с яйца и зеленчуци в гювече.',
    },
    en: {
      title: 'Sirene po Shopski',
      description: 'Baked sirene with eggs, tomato and peppers in clay pot.',
    },
  },
  'chushki-burek': {
    bg: {
      title: 'Чушки бюрек',
      description: 'Пълнени чушки със сирене, панирани и пържени.',
    },
    en: {
      title: 'Chushki Burek',
      description: 'Roasted peppers stuffed with sirene and fried in batter.',
    },
  },
  patatnik: {
    bg: {
      title: 'Пататник',
      description: 'Родопски специалитет от картофи и подправки.',
    },
    en: {
      title: 'Patatnik',
      description: 'Rhodopes potato pie with onions and mint.',
    },
  },
  kapama: {
    bg: {
      title: 'Капама',
      description: 'Празнично ястие с месо и кисело зеле.',
    },
    en: {
      title: 'Kapama',
      description: 'Festive layered meat and sauerkraut dish.',
    },
  },
  'tarama-salad': {
    bg: {
      title: 'Тарама хайвер',
      description: 'Кремообразна салата от рибен хайвер.',
    },
    en: {
      title: 'Tarama Salad',
      description: 'Creamy fish roe dip with lemon and olive oil.',
    },
  },
  'chicken-fricassee': {
    bg: {
      title: 'Пилешко фрикасе',
      description: 'Крехко пиле със застройка от яйца и кисело мляко.',
    },
    en: {
      title: 'Chicken Fricassee',
      description: 'Tender chicken in velvety egg-yogurt sauce.',
    },
  },
  'lentil-soup': {
    bg: {
      title: 'Леща супа',
      description: 'Хранителна супа от леща и зеленчуци.',
    },
    en: {
      title: 'Lentil Soup',
      description: 'Hearty lentil soup with carrots and spices.',
    },
  },
  'green-beans-stew': {
    bg: {
      title: 'Яхния със зелен фасул',
      description: 'Домашна яхния със зелен фасул и домати.',
    },
    en: {
      title: 'Green Beans Stew',
      description: 'Tomato-based green beans stew with fresh herbs.',
    },
  },
  'imam-bayildi': {
    bg: {
      title: 'Имамбаялдъ',
      description: 'Пълнени патладжани с лук, домати и чесън.',
    },
    en: {
      title: 'Imam Bayildi',
      description: 'Stuffed eggplants with onion, garlic and tomato.',
    },
  },
  ratatouille: {
    bg: {
      title: 'Рататуй',
      description: 'Френска зеленчукова класика, печена с билки.',
    },
    en: {
      title: 'Ratatouille',
      description: 'Classic French vegetable bake with herbs.',
    },
  },
  'spaghetti-bolognese': {
    bg: {
      title: 'Спагети Болонезе',
      description: 'Спагети с телешки доматен сос.',
    },
    en: {
      title: 'Spaghetti Bolognese',
      description: 'Pasta with slow-cooked beef tomato sauce.',
    },
  },
  'risotto-mushroom': {
    bg: {
      title: 'Ризото с гъби',
      description: 'Кремообразно ризото с гъби и пармезан.',
    },
    en: {
      title: 'Mushroom Risotto',
      description: 'Creamy Arborio rice with mushrooms and parmesan.',
    },
  },
  'chicken-curry': {
    bg: {
      title: 'Пилешко къри',
      description: 'Ароматно къри с пилешко и кокосово мляко.',
    },
    en: {
      title: 'Chicken Curry',
      description: 'Fragrant curry with chicken and coconut milk.',
    },
  },
  'beef-stroganoff': {
    bg: {
      title: 'Бийф Строганов',
      description: 'Телешко в кремообразен сос с гъби.',
    },
    en: {
      title: 'Beef Stroganoff',
      description: 'Sauteed beef strips in creamy mushroom sauce.',
    },
  },
  paella: {
    bg: {
      title: 'Паеля',
      description: 'Испанско ястие с ориз, морски дарове и шафран.',
    },
    en: {
      title: 'Paella',
      description: 'Spanish rice dish with seafood and saffron.',
    },
  },
  'fish-tacos': {
    bg: {
      title: 'Такос с риба',
      description: 'Хрупкава риба в тортили със свежа салата.',
    },
    en: {
      title: 'Fish Tacos',
      description: 'Crispy fish tacos with lime slaw.',
    },
  },
  cheesecake: {
    bg: {
      title: 'Чийзкейк',
      description: 'Класически печен чийзкейк с бисквитен блат.',
    },
    en: {
      title: 'Cheesecake',
      description: 'Classic baked cheesecake with biscuit crust.',
    },
  },
  'stuffed-peppers': {
    bg: {
      title: 'Пълнени чушки',
      description: 'Печени чушки, пълнени с ориз и кайма.',
    },
    en: {
      title: 'Stuffed Peppers',
      description: 'Bell peppers filled with rice and minced meat.',
    },
  },
  'chicken-soup': {
    bg: {
      title: 'Пилешка супа',
      description: 'Успокояваща супа с пиле, зеленчуци и фиде.',
    },
    en: {
      title: 'Chicken Soup',
      description: 'Comforting soup with chicken, vegetables and noodles.',
    },
  },
  'ribs-with-honey': {
    bg: {
      title: 'Ребърца с мед',
      description: 'Печени свински ребра с медена глазура.',
    },
    en: {
      title: 'Honey Glazed Ribs',
      description: 'Oven-baked pork ribs with honey and mustard glaze.',
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
