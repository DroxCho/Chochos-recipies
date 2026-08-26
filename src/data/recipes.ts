import type {
  CreateRecipeInput,
  Recipe,
  RecipeCuisine,
  RecipeDishType,
  RecipeOwnerRole,
  RecipeStatus,
  UpdateRecipeInput,
} from '../types/recipe';
import { getSupabaseClient, hasSupabaseAnonKey } from '../lib/supabase';

export const recipes: Recipe[] = [
  {
    id: 'shopska-salad',
    title: 'Shopska Salad',
    description: 'Tomatoes, cucumbers, peppers, onion, and sirene cheese.',
    prepMinutes: 15,
    servings: 2,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'banitsa',
    title: 'Banitsa',
    description: 'Layered filo pastry with eggs, yogurt, and white cheese.',
    prepMinutes: 50,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'tarator',
    title: 'Tarator',
    description: 'Cold yogurt soup with cucumber, dill, and garlic.',
    prepMinutes: 10,
    servings: 3,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'kunefe',
    title: 'Kunefe',
    description: 'Crispy kadaif pastry with melted cheese and fragrant syrup.',
    prepMinutes: 45,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'musaka',
    title: 'Musaka',
    description: 'Layered potatoes, minced meat and creamy topping baked until golden.',
    prepMinutes: 80,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'sarmi',
    title: 'Sarmi',
    description: 'Vine or cabbage leaves stuffed with rice and minced meat.',
    prepMinutes: 90,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'kavarma',
    title: 'Kavarma',
    description: 'Slow-cooked pork with onions, peppers and tomatoes.',
    prepMinutes: 70,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'bob-chorba',
    title: 'Bob Chorba',
    description: 'Traditional Bulgarian bean soup with herbs.',
    prepMinutes: 85,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'gyuvech',
    title: 'Gyuvech',
    description: 'Oven-baked vegetable and meat stew.',
    prepMinutes: 100,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'kebapcheta',
    title: 'Kebapcheta',
    description: 'Grilled minced meat rolls seasoned with cumin and pepper.',
    prepMinutes: 35,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'kyufteta',
    title: 'Kyufteta',
    description: 'Juicy grilled meatballs with onion and spices.',
    prepMinutes: 35,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'shopski-kebap',
    title: 'Shopski Kebap',
    description: 'Pork stew with vegetables and white wine.',
    prepMinutes: 75,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'banichki',
    title: 'Banichki',
    description: 'Mini pastry rolls with sirene cheese filling.',
    prepMinutes: 45,
    servings: 8,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'tikvenik',
    title: 'Tikvenik',
    description: 'Sweet pumpkin pastry with cinnamon and walnuts.',
    prepMinutes: 60,
    servings: 8,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'palachinki',
    title: 'Palachinki',
    description: 'Thin crepes served with jam, honey or chocolate.',
    prepMinutes: 25,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'mekitsi',
    title: 'Mekitsi',
    description: 'Fried fluffy dough served with powdered sugar or sirene.',
    prepMinutes: 50,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'sirene-po-shopski',
    title: 'Sirene po Shopski',
    description: 'Baked sirene with eggs, tomato and peppers in clay pot.',
    prepMinutes: 25,
    servings: 2,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'chushki-burek',
    title: 'Chushki Burek',
    description: 'Roasted peppers stuffed with sirene and fried in batter.',
    prepMinutes: 45,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'patatnik',
    title: 'Patatnik',
    description: 'Rhodopes potato pie with onions and mint.',
    prepMinutes: 55,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'kapama',
    title: 'Kapama',
    description: 'Festive layered meat and sauerkraut dish.',
    prepMinutes: 150,
    servings: 8,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'tarama-salad',
    title: 'Tarama Salad',
    description: 'Creamy fish roe dip with lemon and olive oil.',
    prepMinutes: 15,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'chicken-fricassee',
    title: 'Chicken Fricassee',
    description: 'Tender chicken in velvety egg-yogurt sauce.',
    prepMinutes: 55,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'lentil-soup',
    title: 'Lentil Soup',
    description: 'Hearty lentil soup with carrots and spices.',
    prepMinutes: 45,
    servings: 5,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'green-beans-stew',
    title: 'Green Beans Stew',
    description: 'Tomato-based green beans stew with fresh herbs.',
    prepMinutes: 50,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'imam-bayildi',
    title: 'Imam Bayildi',
    description: 'Stuffed eggplants with onion, garlic and tomato.',
    prepMinutes: 75,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'ratatouille',
    title: 'Ratatouille',
    description: 'Classic French vegetable bake with herbs.',
    prepMinutes: 65,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'spaghetti-bolognese',
    title: 'Spaghetti Bolognese',
    description: 'Pasta with slow-cooked beef tomato sauce.',
    prepMinutes: 60,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'risotto-mushroom',
    title: 'Mushroom Risotto',
    description: 'Creamy Arborio rice with mushrooms and parmesan.',
    prepMinutes: 45,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'chicken-curry',
    title: 'Chicken Curry',
    description: 'Fragrant curry with chicken and coconut milk.',
    prepMinutes: 50,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'beef-stroganoff',
    title: 'Beef Stroganoff',
    description: 'Sauteed beef strips in creamy mushroom sauce.',
    prepMinutes: 55,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'paella',
    title: 'Paella',
    description: 'Spanish rice dish with seafood and saffron.',
    prepMinutes: 70,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'fish-tacos',
    title: 'Fish Tacos',
    description: 'Crispy fish tacos with lime slaw.',
    prepMinutes: 35,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'cheesecake',
    title: 'Cheesecake',
    description: 'Classic baked cheesecake with biscuit crust.',
    prepMinutes: 90,
    servings: 8,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'stuffed-peppers',
    title: 'Stuffed Peppers',
    description: 'Bell peppers filled with rice and minced meat.',
    prepMinutes: 70,
    servings: 5,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'chicken-soup',
    title: 'Chicken Soup',
    description: 'Comforting soup with chicken, vegetables and noodles.',
    prepMinutes: 50,
    servings: 5,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'ribs-with-honey',
    title: 'Honey Glazed Ribs',
    description: 'Oven-baked pork ribs with honey and mustard glaze.',
    prepMinutes: 120,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegan-buddha-bowl',
    title: 'Vegan Buddha Bowl',
    description: 'Quinoa bowl with roasted chickpeas, avocado and tahini dressing.',
    prepMinutes: 30,
    servings: 3,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegan-lentil-dahl',
    title: 'Vegan Lentil Dahl',
    description: 'Creamy red lentil dahl with coconut milk, tomato and warm spices.',
    prepMinutes: 40,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegan-tofu-stir-fry',
    title: 'Vegan Tofu Stir-Fry',
    description: 'Crispy tofu with mixed vegetables in soy-ginger sauce.',
    prepMinutes: 25,
    servings: 3,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegetarian-spinach-lasagna',
    title: 'Vegetarian Spinach Lasagna',
    description: 'Layered lasagna with spinach, ricotta and rich tomato sauce.',
    prepMinutes: 65,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegetarian-mushroom-risotto',
    title: 'Vegetarian Mushroom Risotto',
    description: 'Creamy arborio risotto with sauteed mushrooms and parmesan.',
    prepMinutes: 45,
    servings: 4,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
  {
    id: 'vegetarian-greek-pie',
    title: 'Vegetarian Greek Pie',
    description: 'Crispy filo pie filled with spinach, herbs and feta cheese.',
    prepMinutes: 55,
    servings: 6,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  },
];

const RECIPE_META_KEY = 'recipes_meta_v1';
const LOCAL_RECIPES_KEY = 'recipes_local_v1';
const DELETED_RECIPES_KEY = 'recipes_deleted_v1';

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id);
}

function readLocalRecipes(): Recipe[] {
  const deletedIds = readDeletedRecipeIds();

  if (typeof window === 'undefined') {
    return recipes.filter((recipe) => !deletedIds.has(recipe.id));
  }

  const raw = localStorage.getItem(LOCAL_RECIPES_KEY);
  if (!raw) {
    return recipes.filter((recipe) => !deletedIds.has(recipe.id));
  }

  try {
    const parsed = (JSON.parse(raw) as Recipe[]).filter((recipe) => !deletedIds.has(recipe.id));
    if (parsed.length === 0) {
      return recipes.filter((recipe) => !deletedIds.has(recipe.id));
    }

    const byId = new Map(parsed.map((recipe) => [recipe.id, recipe]));
    for (const seededRecipe of recipes.filter((recipe) => !deletedIds.has(recipe.id))) {
      if (!byId.has(seededRecipe.id)) {
        byId.set(seededRecipe.id, seededRecipe);
      }
    }

    return Array.from(byId.values());
  } catch {
    return recipes.filter((recipe) => !deletedIds.has(recipe.id));
  }
}

function writeLocalRecipes(localRecipes: Recipe[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(localRecipes));
}

function readDeletedRecipeIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const raw = localStorage.getItem(DELETED_RECIPES_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeDeletedRecipeIds(ids: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(DELETED_RECIPES_KEY, JSON.stringify(Array.from(ids)));
}

function markRecipeDeleted(id: string): void {
  const ids = readDeletedRecipeIds();
  ids.add(id);
  writeDeletedRecipeIds(ids);
}

function clearDeletedRecipeMark(id: string): void {
  const ids = readDeletedRecipeIds();
  if (!ids.has(id)) {
    return;
  }

  ids.delete(id);
  writeDeletedRecipeIds(ids);
}

function getRecipeByIdFromLocal(id: string): Recipe | undefined {
  return readLocalRecipes().find((recipe) => recipe.id === id);
}

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  prep_minutes: number | null;
  servings: number | null;
}

interface RecipeMeta {
  status: RecipeStatus;
  reviewComment?: string;
  ownerId: string;
  ownerRole: RecipeOwnerRole;
  complexity?: 'easy' | 'medium' | 'hard';
  dishType?: RecipeDishType;
  cuisine?: RecipeCuisine;
  ingredients?: string[];
  steps?: string[];
  notes?: string;
  photoUrls?: string[];
}

type RecipeMetaMap = Record<string, RecipeMeta>;

const PRESET_RECIPE_TAGS: Record<string, { dishType: RecipeDishType; cuisine: RecipeCuisine }> = {
  'shopska-salad': { dishType: 'salad', cuisine: 'bulgarian' },
  banitsa: { dishType: 'breakfast', cuisine: 'bulgarian' },
  tarator: { dishType: 'soup', cuisine: 'bulgarian' },
  kunefe: { dishType: 'dessert', cuisine: 'turkish' },
  musaka: { dishType: 'main', cuisine: 'bulgarian' },
  sarmi: { dishType: 'main', cuisine: 'bulgarian' },
  kavarma: { dishType: 'main', cuisine: 'bulgarian' },
  'bob-chorba': { dishType: 'soup', cuisine: 'bulgarian' },
  gyuvech: { dishType: 'main', cuisine: 'bulgarian' },
  kebapcheta: { dishType: 'main', cuisine: 'bulgarian' },
  kyufteta: { dishType: 'main', cuisine: 'bulgarian' },
  'shopski-kebap': { dishType: 'main', cuisine: 'bulgarian' },
  banichki: { dishType: 'breakfast', cuisine: 'bulgarian' },
  tikvenik: { dishType: 'dessert', cuisine: 'bulgarian' },
  palachinki: { dishType: 'dessert', cuisine: 'international' },
  mekitsi: { dishType: 'breakfast', cuisine: 'bulgarian' },
  'sirene-po-shopski': { dishType: 'appetizer', cuisine: 'bulgarian' },
  'chushki-burek': { dishType: 'appetizer', cuisine: 'bulgarian' },
  patatnik: { dishType: 'main', cuisine: 'bulgarian' },
  kapama: { dishType: 'main', cuisine: 'bulgarian' },
  'tarama-salad': { dishType: 'appetizer', cuisine: 'bulgarian' },
  'chicken-fricassee': { dishType: 'main', cuisine: 'french' },
  'lentil-soup': { dishType: 'soup', cuisine: 'international' },
  'green-beans-stew': { dishType: 'main', cuisine: 'bulgarian' },
  'imam-bayildi': { dishType: 'main', cuisine: 'turkish' },
  ratatouille: { dishType: 'main', cuisine: 'french' },
  'spaghetti-bolognese': { dishType: 'main', cuisine: 'italian' },
  'risotto-mushroom': { dishType: 'main', cuisine: 'italian' },
  'chicken-curry': { dishType: 'main', cuisine: 'asian' },
  'beef-stroganoff': { dishType: 'main', cuisine: 'international' },
  paella: { dishType: 'main', cuisine: 'spanish' },
  'fish-tacos': { dishType: 'main', cuisine: 'mexican' },
  cheesecake: { dishType: 'dessert', cuisine: 'international' },
  'stuffed-peppers': { dishType: 'main', cuisine: 'bulgarian' },
  'chicken-soup': { dishType: 'soup', cuisine: 'bulgarian' },
  'ribs-with-honey': { dishType: 'main', cuisine: 'international' },
  'vegan-buddha-bowl': { dishType: 'main', cuisine: 'vegan' },
  'vegan-lentil-dahl': { dishType: 'soup', cuisine: 'vegan' },
  'vegan-tofu-stir-fry': { dishType: 'main', cuisine: 'vegan' },
  'vegetarian-spinach-lasagna': { dishType: 'main', cuisine: 'vegetarian' },
  'vegetarian-mushroom-risotto': { dishType: 'main', cuisine: 'vegetarian' },
  'vegetarian-greek-pie': { dishType: 'main', cuisine: 'vegetarian' },
};

const PRESET_RECIPE_META: RecipeMetaMap = {
  kunefe: {
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
    complexity: 'hard',
    ingredients: [
      '400 г кадаиф',
      '250 г моцарела или кашкавал без сол',
      '180 г масло',
      '250 г захар',
      '250 мл вода',
      '1 ч.л. лимонов сок',
      'Шамфъстък за поръсване',
    ],
    steps: [
      'Приготви сироп от вода, захар и лимонов сок, после го остави да изстине.',
      'Раздели кадаифа, смеси с разтопено масло и покрий дъното на тавата с половината.',
      'Добави настърганото сирене по средата и покрий с останалия кадаиф.',
      'Печи до златисто от двете страни, след което залей с изстиналия сироп.',
      'Остави 10 минути да поеме и сервирай с шамфъстък.',
    ],
    photoUrls: ['https://images.unsplash.com/photo-1551024601-bec78aea704b'],
  },
  musaka: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['800 г картофи', '500 г кайма', '1 лук', '2 яйца', '400 г кисело мляко'],
    steps: ['Задуши каймата с лук.', 'Подреди картофи и кайма на пластове.', 'Залей със заливка и печи до златисто.'],
    photoUrls: ['https://images.unsplash.com/photo-1544025162-d76694265947'],
  },
  sarmi: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'hard',
    ingredients: ['1 зелка или лозови листа', '400 г кайма', '1 ч.ч. ориз', '1 лук', 'чубрица'],
    steps: ['Приготви плънка от кайма и ориз.', 'Завий сармите.', 'Вари или печи до готовност.'],
    photoUrls: ['https://images.unsplash.com/photo-1515003197210-e0cd71810b5f'],
  },
  kavarma: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['700 г свинско', '2 глави лук', '2 чушки', '2 домата', 'червен пипер'],
    steps: ['Запържи месото.', 'Добави зеленчуците и подправките.', 'Готви бавно до сгъстяване.'],
    photoUrls: ['https://images.unsplash.com/photo-1604908176997-4311d66f4f6d'],
  },
  'bob-chorba': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['500 г боб', '1 морков', '1 лук', 'джоджен', 'червен пипер'],
    steps: ['Свари боба.', 'Добави зеленчуците.', 'Овкуси и довари.'],
    photoUrls: ['https://images.unsplash.com/photo-1547592166-23ac45744acd'],
  },
  gyuvech: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['600 г месо', 'патладжан', 'тиквичка', 'домати', 'картофи'],
    steps: ['Нарежи продуктите.', 'Подреди ги в тава.', 'Печи до омекване.'],
    photoUrls: ['https://images.unsplash.com/photo-1512058564366-18510be2db19'],
  },
  kebapcheta: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['700 г кайма', 'кимион', 'черен пипер', 'сол'],
    steps: ['Омеси каймата с подправки.', 'Оформи кебапчета.', 'Изпечи на скара.'],
    photoUrls: ['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd'],
  },
  kyufteta: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['700 г кайма', '1 лук', 'магданоз', 'кимион'],
    steps: ['Смеси каймата с подправките.', 'Оформи кюфтета.', 'Изпечи на грил.'],
    photoUrls: ['https://images.unsplash.com/photo-1526318896980-cf78c088247c'],
  },
  'shopski-kebap': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['700 г свинско', 'лук', 'чушки', 'гъби', 'бяло вино'],
    steps: ['Запържи месото.', 'Добави зеленчуците.', 'Задуши с вино до готовност.'],
    photoUrls: ['https://images.unsplash.com/photo-1547592180-85f173990554'],
  },
  banichki: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['кори за баница', '300 г сирене', '2 яйца', '50 мл олио'],
    steps: ['Приготви плънката.', 'Навий малки банички.', 'Печи до златисто.'],
    photoUrls: ['https://images.unsplash.com/photo-1605478900060-0a9d68f9b5f4'],
  },
  tikvenik: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['кори за баница', '600 г тиква', 'захар', 'канела', 'орехи'],
    steps: ['Настържи тиквата.', 'Навий корите с плънка.', 'Изпечи и поръси със захар.'],
    photoUrls: ['https://images.unsplash.com/photo-1509440159596-0249088772ff'],
  },
  palachinki: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['2 яйца', '300 мл мляко', '150 г брашно', 'щипка сол'],
    steps: ['Смеси продуктите.', 'Изпечи тънки палачинки.', 'Сервирай с плънка по избор.'],
    photoUrls: ['https://images.unsplash.com/photo-1528207776546-365bb710ee93'],
  },
  mekitsi: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['500 г брашно', '250 мл кисело мляко', '1 яйце', 'сода', 'олио за пържене'],
    steps: ['Замеси меко тесто.', 'Остави да втаса.', 'Изпържи до златисто.'],
    photoUrls: ['https://images.unsplash.com/photo-1601315576604-87f67f6f8f95'],
  },
  'sirene-po-shopski': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['300 г сирене', '2 яйца', '1 домат', '1 чушка'],
    steps: ['Сложи сиренето и зеленчуците в гювече.', 'Добави яйцата.', 'Печи 15-20 минути.'],
    photoUrls: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c'],
  },
  'chushki-burek': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['8 печени чушки', '300 г сирене', '2 яйца', 'брашно'],
    steps: ['Напълни чушките със сирене.', 'Панирай в яйце и брашно.', 'Изпържи до златисто.'],
    photoUrls: ['https://images.unsplash.com/photo-1544025162-d76694265947'],
  },
  patatnik: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['1 кг картофи', '1 лук', 'джоджен', 'масло'],
    steps: ['Настържи картофите.', 'Смеси с лук и подправки.', 'Печи в тиган или фурна.'],
    photoUrls: ['https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6'],
  },
  kapama: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'hard',
    ingredients: ['свинско', 'телешко', 'кисело зеле', 'ориз', 'сушени сливи'],
    steps: ['Подреди продуктите на пластове.', 'Добави подправки и вино.', 'Печи бавно няколко часа.'],
    photoUrls: ['https://images.unsplash.com/photo-1547592166-23ac45744acd'],
  },
  'tarama-salad': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['100 г тарама', 'хляб', 'лимонов сок', 'зехтин'],
    steps: ['Накисни хляба.', 'Пасирай с тарамата.', 'Добавяй зехтин до кремообразност.'],
    photoUrls: ['https://images.unsplash.com/photo-1556911220-bff31c812dba'],
  },
  'chicken-fricassee': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['700 г пилешко', '2 яйца', '200 г кисело мляко', 'брашно'],
    steps: ['Свари пилето.', 'Приготви застройка.', 'Смеси и загрей без кипене.'],
    photoUrls: ['https://images.unsplash.com/photo-1532550907401-a500c9a57435'],
  },
  'lentil-soup': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['300 г леща', '1 морков', '1 лук', 'чубрица'],
    steps: ['Свари лещата.', 'Добави зеленчуците.', 'Овкуси и остави да къкри.'],
    photoUrls: ['https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a'],
  },
  'green-beans-stew': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['700 г зелен фасул', 'домати', 'лук', 'морков'],
    steps: ['Запържи лук и морков.', 'Добави фасула и доматите.', 'Готви до омекване.'],
    photoUrls: ['https://images.unsplash.com/photo-1547592166-23ac45744acd'],
  },
  'imam-bayildi': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['3 патладжана', '2 глави лук', 'домати', 'чесън', 'магданоз'],
    steps: ['Издълбай и запечи патладжаните.', 'Приготви плънка от лук и домати.', 'Напълни и печи до готовност.'],
    photoUrls: ['https://images.unsplash.com/photo-1551183053-bf91a1d81141'],
  },
  ratatouille: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['тиквички', 'патладжан', 'домати', 'чушки', 'мащерка'],
    steps: ['Нарежи зеленчуците.', 'Подреди ги в тава.', 'Печи с доматен сос и подправки.'],
    photoUrls: ['https://images.unsplash.com/photo-1473093295043-cdd812d0e601'],
  },
  'spaghetti-bolognese': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['400 г спагети', '500 г телешка кайма', 'домати', 'лук', 'чесън'],
    steps: ['Сготви соса от кайма и домати.', 'Свари спагетите.', 'Сервирай със соса.'],
    photoUrls: ['https://images.unsplash.com/photo-1622973536968-3ead9e780960'],
  },
  'risotto-mushroom': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['300 г ориз арборио', '300 г гъби', '1 л бульон', 'пармезан'],
    steps: ['Задуши гъбите.', 'Добавяй бульон към ориза постепенно.', 'Финализирай с пармезан.'],
    photoUrls: ['https://images.unsplash.com/photo-1476124369491-e7addf5db371'],
  },
  'chicken-curry': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['700 г пилешко', 'къри паста', '400 мл кокосово мляко', 'лук'],
    steps: ['Запържи пилето.', 'Добави пастата и кокосовото мляко.', 'Готви до сгъстяване.'],
    photoUrls: ['https://images.unsplash.com/photo-1604909052743-94e838986d24'],
  },
  'beef-stroganoff': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['600 г телешко', 'гъби', 'заквасена сметана', 'лук', 'горчица'],
    steps: ['Запечатай месото.', 'Добави гъби и лук.', 'Финализирай със сметана.'],
    photoUrls: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6'],
  },
  paella: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'hard',
    ingredients: ['400 г ориз', 'морски дарове', 'шафран', 'чушки', 'грах'],
    steps: ['Запържи зеленчуците.', 'Добави ориза и шафрана.', 'Готви с бульон и морски дарове.'],
    photoUrls: ['https://images.unsplash.com/photo-1515443961218-a51367888e4b'],
  },
  'fish-tacos': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['400 г бяла риба', 'тортили', 'зеле', 'лайм', 'кисело мляко'],
    steps: ['Изпечи или изпържи рибата.', 'Приготви салата от зеле.', 'Сглоби такосите и сервирай.'],
    photoUrls: ['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b'],
  },
  cheesecake: {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['300 г бисквити', '120 г масло', '600 г крем сирене', '200 г захар', '3 яйца'],
    steps: ['Направи блат от бисквити и масло.', 'Приготви крема и излей върху блата.', 'Печи и охлади добре.'],
    photoUrls: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad'],
  },
  'stuffed-peppers': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
    ingredients: ['8 чушки', '400 г кайма', '1 ч.ч. ориз', 'лук', 'доматен сос'],
    steps: ['Приготви плънката.', 'Напълни чушките.', 'Печи със сос до готовност.'],
    photoUrls: ['https://images.unsplash.com/photo-1598514983318-2f64f8f4796c'],
  },
  'chicken-soup': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
    ingredients: ['500 г пилешко', 'морков', 'целина', 'фиде', 'магданоз'],
    steps: ['Свари пилето и зеленчуците.', 'Добави фидето.', 'Овкуси и сервирай.'],
    photoUrls: ['https://images.unsplash.com/photo-1547592166-23ac45744acd'],
  },
  'ribs-with-honey': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'hard',
    ingredients: ['1 кг свински ребра', '2 с.л. мед', '1 с.л. горчица', 'соев сос', 'чесън'],
    steps: ['Мариновай ребрата.', 'Печи покрити до омекване.', 'Глазирай и запечи до карамелизация.'],
    photoUrls: ['https://images.unsplash.com/photo-1529692236671-f1dc99fe1f4e'],
  },
  'vegan-buddha-bowl': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
  },
  'vegan-lentil-dahl': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
  },
  'vegan-tofu-stir-fry': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'easy',
  },
  'vegetarian-spinach-lasagna': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
  },
  'vegetarian-mushroom-risotto': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
  },
  'vegetarian-greek-pie': {
    status: 'approved', ownerId: 'admin-user-1', ownerRole: 'admin', complexity: 'medium',
  },
};

function normalizeRecipeId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildRecipeId(title: string): string {
  const base = normalizeRecipeId(title);
  const fallback = `recipe-${Date.now()}`;
  return base.length > 0 ? `${base}-${Date.now()}` : fallback;
}

function normalizeStringList(items: string[] | undefined): string[] | undefined {
  const normalized = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function readRecipeMetaMap(): RecipeMetaMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(RECIPE_META_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as RecipeMetaMap;
  } catch {
    return {};
  }
}

function writeRecipeMetaMap(map: RecipeMetaMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_META_KEY, JSON.stringify(map));
}

function removeRecipeMeta(id: string): void {
  const map = readRecipeMetaMap();
  if (!map[id]) {
    return;
  }

  delete map[id];
  writeRecipeMetaMap(map);
}

function getDefaultRecipeMeta(): RecipeMeta {
  return {
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  };
}

function applyMeta(recipe: Recipe, map: RecipeMetaMap): Recipe {
  const defaultMeta = getDefaultRecipeMeta();
  const presetTags = PRESET_RECIPE_TAGS[recipe.id];
  const meta = map[recipe.id] ?? PRESET_RECIPE_META[recipe.id] ?? defaultMeta;

  return {
    ...recipe,
    status: meta.status,
    reviewComment: meta.reviewComment,
    ownerId: meta.ownerId,
    ownerRole: meta.ownerRole,
    complexity: meta.complexity ?? PRESET_RECIPE_META[recipe.id]?.complexity ?? 'medium',
    dishType: meta.dishType ?? presetTags?.dishType ?? 'main',
    cuisine: meta.cuisine ?? presetTags?.cuisine ?? 'international',
    ingredients: normalizeStringList(meta.ingredients),
    steps: normalizeStringList(meta.steps),
    notes: meta.notes?.trim() ? meta.notes.trim() : undefined,
    photoUrls: normalizeStringList(meta.photoUrls),
  };
}

function persistRecipeMeta(id: string, patch: Partial<RecipeMeta>): RecipeMeta {
  const map = readRecipeMetaMap();
  const current = map[id] ?? PRESET_RECIPE_META[id] ?? getDefaultRecipeMeta();

  const next: RecipeMeta = {
    ...current,
    ...patch,
    reviewComment: patch.reviewComment ?? current.reviewComment,
    dishType: patch.dishType ?? current.dishType,
    cuisine: patch.cuisine ?? current.cuisine,
    ingredients: normalizeStringList(patch.ingredients ?? current.ingredients),
    steps: normalizeStringList(patch.steps ?? current.steps),
    notes: patch.notes !== undefined ? (patch.notes.trim() ? patch.notes.trim() : undefined) : current.notes,
    photoUrls: normalizeStringList(patch.photoUrls ?? current.photoUrls),
  };

  map[id] = next;
  writeRecipeMetaMap(map);
  return next;
}

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    prepMinutes: row.prep_minutes ?? 0,
    servings: row.servings ?? 0,
    status: 'approved',
    ownerId: 'admin-user-1',
    ownerRole: 'admin',
  };
}

function mergeRecipesById(primary: Recipe[], secondary: Recipe[]): Recipe[] {
  const byId = new Map(primary.map((recipe) => [recipe.id, recipe]));

  for (const recipe of secondary) {
    if (!byId.has(recipe.id)) {
      byId.set(recipe.id, recipe);
    }
  }

  return Array.from(byId.values());
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const metaMap = readRecipeMetaMap();
  const localRecipes = readLocalRecipes();

  if (!hasSupabaseAnonKey) {
    return localRecipes.map((recipe) => applyMeta(recipe, metaMap));
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return localRecipes.map((recipe) => applyMeta(recipe, metaMap));
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,description,prep_minutes,servings')
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  const supabaseRecipes = (data as RecipeRow[] | null | undefined)?.map((row) => mapRecipeRow(row)) ?? [];
  const mergedRecipes = mergeRecipesById(supabaseRecipes, localRecipes);

  return mergedRecipes.map((recipe) => applyMeta(recipe, metaMap));
}

export async function fetchRecipeById(id: string): Promise<Recipe | undefined> {
  const metaMap = readRecipeMetaMap();

  if (!hasSupabaseAnonKey) {
    const fallbackRecipe = getRecipeByIdFromLocal(id);
    return fallbackRecipe ? applyMeta(fallbackRecipe, metaMap) : undefined;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const fallbackRecipe = getRecipeByIdFromLocal(id);
    return fallbackRecipe ? applyMeta(fallbackRecipe, metaMap) : undefined;
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,description,prep_minutes,servings')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const fallbackRecipe = getRecipeByIdFromLocal(id);
    return fallbackRecipe ? applyMeta(fallbackRecipe, metaMap) : undefined;
  }

  return applyMeta(mapRecipeRow(data as RecipeRow), metaMap);
}

export async function insertRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const id = buildRecipeId(input.title);

  const payload = {
    id,
    title: input.title,
    description: input.description,
    prep_minutes: input.prepMinutes,
    servings: input.servings,
  };

  const metaPatch: Partial<RecipeMeta> = {
    status: input.status ?? 'approved',
    reviewComment: input.reviewComment,
    ownerId: input.ownerId ?? 'admin-user-1',
    ownerRole: input.ownerRole ?? 'admin',
    complexity: input.complexity,
    dishType: input.dishType,
    cuisine: input.cuisine,
    ingredients: input.ingredients,
    steps: input.steps,
    notes: input.notes,
    photoUrls: input.photoUrls,
  };

  if (!hasSupabaseAnonKey) {
    const createdRecipe: Recipe = {
      id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: 'approved',
      ownerId: 'admin-user-1',
      ownerRole: 'admin',
    };

    const localRecipes = readLocalRecipes();
    writeLocalRecipes([createdRecipe, ...localRecipes.filter((recipe) => recipe.id !== createdRecipe.id)]);
    persistRecipeMeta(id, metaPatch);
    clearDeletedRecipeMark(id);
    return applyMeta(createdRecipe, readRecipeMetaMap());
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const createdRecipe: Recipe = {
      id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: 'approved',
      ownerId: 'admin-user-1',
      ownerRole: 'admin',
    };

    const localRecipes = readLocalRecipes();
    writeLocalRecipes([createdRecipe, ...localRecipes.filter((recipe) => recipe.id !== createdRecipe.id)]);
    persistRecipeMeta(id, metaPatch);
    clearDeletedRecipeMark(id);
    return applyMeta(createdRecipe, readRecipeMetaMap());
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert(payload)
    .select('id,title,description,prep_minutes,servings')
    .single();

  if (error) {
    throw error;
  }

  persistRecipeMeta(id, metaPatch);
  clearDeletedRecipeMark(id);
  return applyMeta(mapRecipeRow(data as RecipeRow), readRecipeMetaMap());
}

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
  const payload = {
    title: input.title,
    description: input.description,
    prep_minutes: input.prepMinutes,
    servings: input.servings,
  };

  const metaPatch: Partial<RecipeMeta> = {
    status: input.status,
    reviewComment: input.reviewComment,
    ownerId: input.ownerId,
    ownerRole: input.ownerRole,
    complexity: input.complexity,
    dishType: input.dishType,
    cuisine: input.cuisine,
    ingredients: input.ingredients,
    steps: input.steps,
    notes: input.notes,
    photoUrls: input.photoUrls,
  };

  if (input.metaOnly) {
    const currentRecipe = await fetchRecipeById(input.id);
    if (!currentRecipe) {
      throw new Error('Recipe not found');
    }

    persistRecipeMeta(input.id, metaPatch);
    return applyMeta(currentRecipe, readRecipeMetaMap());
  }

  if (!hasSupabaseAnonKey) {
    const fallback = getRecipeByIdFromLocal(input.id);
    const updatedFallback: Recipe = {
      id: input.id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: fallback?.status ?? 'approved',
      ownerId: fallback?.ownerId ?? 'admin-user-1',
      ownerRole: fallback?.ownerRole ?? 'admin',
    };

    const localRecipes = readLocalRecipes().map((recipe) =>
      recipe.id === input.id ? updatedFallback : recipe,
    );
    writeLocalRecipes(localRecipes);
    persistRecipeMeta(input.id, metaPatch);
    return applyMeta(updatedFallback, readRecipeMetaMap());
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const fallback = getRecipeByIdFromLocal(input.id);
    const updatedFallback: Recipe = {
      id: input.id,
      title: input.title,
      description: input.description,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      status: fallback?.status ?? 'approved',
      ownerId: fallback?.ownerId ?? 'admin-user-1',
      ownerRole: fallback?.ownerRole ?? 'admin',
    };

    const localRecipes = readLocalRecipes().map((recipe) =>
      recipe.id === input.id ? updatedFallback : recipe,
    );
    writeLocalRecipes(localRecipes);
    persistRecipeMeta(input.id, metaPatch);
    return applyMeta(updatedFallback, readRecipeMetaMap());
  }

  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', input.id)
    .select('id,title,description,prep_minutes,servings')
    .single();

  if (error) {
    throw error;
  }

  persistRecipeMeta(input.id, metaPatch);
  return applyMeta(mapRecipeRow(data as RecipeRow), readRecipeMetaMap());
}

export async function deleteRecipeById(id: string): Promise<void> {
  const localRecipes = readLocalRecipes();
  writeLocalRecipes(localRecipes.filter((recipe) => recipe.id !== id));
  markRecipeDeleted(id);
  removeRecipeMeta(id);

  if (!hasSupabaseAnonKey) {
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}
