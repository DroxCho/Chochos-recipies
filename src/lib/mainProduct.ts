import type { Language } from '../i18n/translations';

export type MainProductValue =
  | 'agneshko-meso'
  | 'bebeshki-hrani'
  | 'bob'
  | 'divech'
  | 'zele'
  | 'zelenchuci'
  | 'zaeshko-meso'
  | 'karantiya'
  | 'leshta'
  | 'mlechni-produkti'
  | 'morski-darove'
  | 'pateshko-meso'
  | 'pileshko-meso'
  | 'plodove'
  | 'pueshko-meso'
  | 'riba'
  | 'oriz'
  | 'svinsko-meso'
  | 'sladoled'
  | 'soleni-pechiva'
  | 'teleshko-meso'
  | 'yastiya-s-yaitsa';

export type MainProductIconType =
  | 'meat'
  | 'chicken'
  | 'baby'
  | 'beans'
  | 'rice'
  | 'lentils'
  | 'cabbage'
  | 'vegetables'
  | 'fruits'
  | 'offal'
  | 'dairy'
  | 'seafood'
  | 'fish'
  | 'dessert'
  | 'pastry'
  | 'egg';

interface MainProductMeta {
  icon: string;
  iconType: MainProductIconType;
  labelBg: string;
  labelEn: string;
}

const MAIN_PRODUCT_META: Record<MainProductValue, MainProductMeta> = {
  'agneshko-meso': { icon: '🐑', iconType: 'meat', labelBg: 'Агнешко месо', labelEn: 'Lamb' },
  'bebeshki-hrani': { icon: '🍼', iconType: 'baby', labelBg: 'Бебешки храни', labelEn: 'Baby food' },
  bob: { icon: '🫘', iconType: 'beans', labelBg: 'Боб', labelEn: 'Beans' },
  divech: { icon: '🦌', iconType: 'meat', labelBg: 'Дивеч', labelEn: 'Game meat' },
  zele: { icon: '🥬', iconType: 'cabbage', labelBg: 'Зеле', labelEn: 'Cabbage' },
  zelenchuci: { icon: '🥕', iconType: 'vegetables', labelBg: 'Зеленчуци', labelEn: 'Vegetables' },
  'zaeshko-meso': { icon: '🐇', iconType: 'meat', labelBg: 'Заешко месо', labelEn: 'Rabbit meat' },
  karantiya: { icon: '🫁', iconType: 'offal', labelBg: 'Карантия', labelEn: 'Offal' },
  leshta: { icon: '🟤', iconType: 'lentils', labelBg: 'Леща', labelEn: 'Lentils' },
  'mlechni-produkti': { icon: '🧀', iconType: 'dairy', labelBg: 'Млечни продукти и заместители', labelEn: 'Dairy and alternatives' },
  'morski-darove': { icon: '🦐', iconType: 'seafood', labelBg: 'Морски дарове', labelEn: 'Seafood' },
  'pateshko-meso': { icon: '🦆', iconType: 'meat', labelBg: 'Патешко месо', labelEn: 'Duck meat' },
  'pileshko-meso': { icon: '🐓', iconType: 'chicken', labelBg: 'Пилешко месо', labelEn: 'Chicken meat' },
  plodove: { icon: '🍎', iconType: 'fruits', labelBg: 'Плодове', labelEn: 'Fruits' },
  'pueshko-meso': { icon: '🦃', iconType: 'meat', labelBg: 'Пуешко месо', labelEn: 'Turkey meat' },
  riba: { icon: '🐟', iconType: 'fish', labelBg: 'Риба', labelEn: 'Fish' },
  oriz: { icon: '🍚', iconType: 'rice', labelBg: 'Ориз', labelEn: 'Rice' },
  'svinsko-meso': { icon: '🐖', iconType: 'meat', labelBg: 'Свинско месо', labelEn: 'Pork' },
  sladoled: { icon: '🍨', iconType: 'dessert', labelBg: 'Сладолед', labelEn: 'Ice cream' },
  'soleni-pechiva': { icon: '🥨', iconType: 'pastry', labelBg: 'Солени печива', labelEn: 'Savory pastries' },
  'teleshko-meso': { icon: '🐄', iconType: 'meat', labelBg: 'Телешко месо', labelEn: 'Beef' },
  'yastiya-s-yaitsa': { icon: '🥚', iconType: 'egg', labelBg: 'Ястия с яйца', labelEn: 'Egg dishes' },
};

export function getMainProductMeta(mainProduct: string | undefined, language: Language): { icon: string; iconType: MainProductIconType; label: string } | null {
  if (!mainProduct) {
    return null;
  }

  const meta = MAIN_PRODUCT_META[mainProduct as MainProductValue];
  if (!meta) {
    return null;
  }

  return {
    icon: meta.icon,
    iconType: meta.iconType,
    label: language === 'bg' ? meta.labelBg : meta.labelEn,
  };
}

export function getMainProductsMeta(mainProducts: string[] | undefined, language: Language): Array<{ key: string; icon: string; iconType: MainProductIconType; label: string }> {
  const uniqueValues = [...new Set((mainProducts ?? []).filter(Boolean))];

  return uniqueValues
    .map((value) => {
      const meta = getMainProductMeta(value, language);
      if (!meta) {
        return null;
      }

      return {
        key: value,
        icon: meta.icon,
        iconType: meta.iconType,
        label: meta.label,
      };
    })
    .filter((item): item is { key: string; icon: string; iconType: MainProductIconType; label: string } => item !== null);
}