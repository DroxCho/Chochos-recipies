import type { Language } from '../i18n/translations';

export type MainProductValue =
  | 'agneshko-meso'
  | 'bebeshki-hrani'
  | 'divech'
  | 'zaeshko-meso'
  | 'karantiya'
  | 'mlechni-produkti'
  | 'morski-darove'
  | 'pateshko-meso'
  | 'pueshko-meso'
  | 'riba'
  | 'svinsko-meso'
  | 'sladoled'
  | 'soleni-pechiva'
  | 'teleshko-meso'
  | 'yastiya-s-yaitsa';

export type MainProductIconType =
  | 'meat'
  | 'baby'
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
  divech: { icon: '🦌', iconType: 'meat', labelBg: 'Дивеч', labelEn: 'Game meat' },
  'zaeshko-meso': { icon: '🐇', iconType: 'meat', labelBg: 'Заешко месо', labelEn: 'Rabbit meat' },
  karantiya: { icon: '🫁', iconType: 'offal', labelBg: 'Карантия', labelEn: 'Offal' },
  'mlechni-produkti': { icon: '🧀', iconType: 'dairy', labelBg: 'Млечни продукти и заместители', labelEn: 'Dairy and alternatives' },
  'morski-darove': { icon: '🦐', iconType: 'seafood', labelBg: 'Морски дарове', labelEn: 'Seafood' },
  'pateshko-meso': { icon: '🦆', iconType: 'meat', labelBg: 'Патешко месо', labelEn: 'Duck meat' },
  'pueshko-meso': { icon: '🦃', iconType: 'meat', labelBg: 'Пуешко месо', labelEn: 'Turkey meat' },
  riba: { icon: '🐟', iconType: 'fish', labelBg: 'Риба', labelEn: 'Fish' },
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