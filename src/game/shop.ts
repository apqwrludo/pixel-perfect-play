export interface ShopItem {
  id: string;
  name: string;
  price: number;
  kind: "dice" | "tokenStyle" | "frame";
  preview: string;
  colorA: string;
  colorB: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "dice-classic",
    name: "نرد كلاسيكي",
    price: 0,
    kind: "dice",
    preview: "عاجي بنقاط سوداء",
    colorA: "oklch(0.97 0.02 90)",
    colorB: "oklch(0.86 0.03 90)",
  },
  {
    id: "dice-gold",
    name: "نرد ذهبي",
    price: 1200,
    kind: "dice",
    preview: "ذهب مصقول",
    colorA: "oklch(0.92 0.11 95)",
    colorB: "oklch(0.7 0.15 76)",
  },
  {
    id: "dice-emerald",
    name: "نرد زمرّدي",
    price: 1800,
    kind: "dice",
    preview: "زمرّد شفّاف",
    colorA: "oklch(0.82 0.14 165)",
    colorB: "oklch(0.55 0.15 168)",
  },
  {
    id: "dice-ruby",
    name: "نرد ياقوتي",
    price: 2400,
    kind: "dice",
    preview: "ياقوت أحمر",
    colorA: "oklch(0.72 0.19 20)",
    colorB: "oklch(0.48 0.2 24)",
  },
  {
    id: "token-classic",
    name: "قطع كلاسيكية",
    price: 0,
    kind: "tokenStyle",
    preview: "قطع لامعة",
    colorA: "oklch(0.9 0.02 90)",
    colorB: "oklch(0.6 0.02 90)",
  },
  {
    id: "token-gem",
    name: "قطع جوهرية",
    price: 1500,
    kind: "tokenStyle",
    preview: "بريق كريستالي",
    colorA: "oklch(0.95 0.06 200)",
    colorB: "oklch(0.65 0.12 250)",
  },
  {
    id: "token-crown",
    name: "قطع متوّجة",
    price: 2600,
    kind: "tokenStyle",
    preview: "تاج ذهبي صغير",
    colorA: "oklch(0.92 0.11 95)",
    colorB: "oklch(0.68 0.15 74)",
  },
  {
    id: "frame-none",
    name: "بدون إطار",
    price: 0,
    kind: "frame",
    preview: "بسيط",
    colorA: "oklch(0.6 0.05 300)",
    colorB: "oklch(0.4 0.05 300)",
  },
  {
    id: "frame-gold",
    name: "إطار ذهبي",
    price: 900,
    kind: "frame",
    preview: "حافة ذهبية",
    colorA: "oklch(0.92 0.11 95)",
    colorB: "oklch(0.66 0.15 72)",
  },
  {
    id: "frame-royal",
    name: "إطار ملكي",
    price: 2000,
    kind: "frame",
    preview: "بنفسجي متوهّج",
    colorA: "oklch(0.78 0.2 315)",
    colorB: "oklch(0.5 0.24 310)",
  },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export const DICE_SKINS: Record<string, { a: string; b: string; pip: string }> = {
  "dice-classic": { a: "oklch(0.98 0.01 90)", b: "oklch(0.85 0.02 90)", pip: "oklch(0.2 0.02 300)" },
  "dice-gold": { a: "oklch(0.94 0.1 95)", b: "oklch(0.68 0.15 74)", pip: "oklch(0.28 0.08 60)" },
  "dice-emerald": { a: "oklch(0.86 0.13 165)", b: "oklch(0.5 0.14 168)", pip: "oklch(0.2 0.06 170)" },
  "dice-ruby": { a: "oklch(0.75 0.18 20)", b: "oklch(0.45 0.19 24)", pip: "oklch(0.97 0.02 30)" },
};
