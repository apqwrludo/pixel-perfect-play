import type { ColorId } from "./types";

export interface Cell {
  r: number;
  c: number;
}

/** مسار اللودو الرئيسي: 52 خانة بالترتيب مع عقارب الساعة على شبكة 15×15 */
export const TRACK: Cell[] = [
  // من بداية الأحمر يميناً على الصف 6
  { r: 6, c: 1 },
  { r: 6, c: 2 },
  { r: 6, c: 3 },
  { r: 6, c: 4 },
  { r: 6, c: 5 },
  // صعوداً على العمود 6
  { r: 5, c: 6 },
  { r: 4, c: 6 },
  { r: 3, c: 6 },
  { r: 2, c: 6 },
  { r: 1, c: 6 },
  { r: 0, c: 6 },
  // أعلى المنتصف
  { r: 0, c: 7 },
  // نزولاً على العمود 8
  { r: 0, c: 8 },
  { r: 1, c: 8 },
  { r: 2, c: 8 },
  { r: 3, c: 8 },
  { r: 4, c: 8 },
  { r: 5, c: 8 },
  // يميناً على الصف 6
  { r: 6, c: 9 },
  { r: 6, c: 10 },
  { r: 6, c: 11 },
  { r: 6, c: 12 },
  { r: 6, c: 13 },
  { r: 6, c: 14 },
  // يمين المنتصف
  { r: 7, c: 14 },
  // يساراً على الصف 8
  { r: 8, c: 14 },
  { r: 8, c: 13 },
  { r: 8, c: 12 },
  { r: 8, c: 11 },
  { r: 8, c: 10 },
  { r: 8, c: 9 },
  // نزولاً على العمود 8
  { r: 9, c: 8 },
  { r: 10, c: 8 },
  { r: 11, c: 8 },
  { r: 12, c: 8 },
  { r: 13, c: 8 },
  { r: 14, c: 8 },
  // أسفل المنتصف
  { r: 14, c: 7 },
  // يساراً على الصف 14 ثم صعوداً على العمود 6
  { r: 14, c: 6 },
  { r: 13, c: 6 },
  { r: 12, c: 6 },
  { r: 11, c: 6 },
  { r: 10, c: 6 },
  { r: 9, c: 6 },
  // يساراً على الصف 8
  { r: 8, c: 5 },
  { r: 8, c: 4 },
  { r: 8, c: 3 },
  { r: 8, c: 2 },
  { r: 8, c: 1 },
  { r: 8, c: 0 },
  // يسار المنتصف
  { r: 7, c: 0 },
  { r: 6, c: 0 },
];

export const COLORS: ColorId[] = ["red", "green", "yellow", "blue"];

export const START_INDEX: Record<ColorId, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/** ممر البيت (5 خانات) لكل لون، والخانة السادسة هي المركز */
export const HOME_PATH: Record<ColorId, Cell[]> = {
  red: [
    { r: 7, c: 1 },
    { r: 7, c: 2 },
    { r: 7, c: 3 },
    { r: 7, c: 4 },
    { r: 7, c: 5 },
  ],
  green: [
    { r: 1, c: 7 },
    { r: 2, c: 7 },
    { r: 3, c: 7 },
    { r: 4, c: 7 },
    { r: 5, c: 7 },
  ],
  yellow: [
    { r: 7, c: 13 },
    { r: 7, c: 12 },
    { r: 7, c: 11 },
    { r: 7, c: 10 },
    { r: 7, c: 9 },
  ],
  blue: [
    { r: 13, c: 7 },
    { r: 12, c: 7 },
    { r: 11, c: 7 },
    { r: 10, c: 7 },
    { r: 9, c: 7 },
  ],
};

export const CENTER: Cell = { r: 7, c: 7 };

/** أركان البيوت (الزاوية العليا اليسرى لمربع 6×6) */
export const BASE_ORIGIN: Record<ColorId, Cell> = {
  red: { r: 0, c: 0 },
  green: { r: 0, c: 9 },
  yellow: { r: 9, c: 9 },
  blue: { r: 9, c: 0 },
};

/** مواقع القطع الأربع داخل البيت */
export function baseSlot(color: ColorId, i: number): Cell {
  const o = BASE_ORIGIN[color];
  const dr = i < 2 ? 1.4 : 3.4;
  const dc = i % 2 === 0 ? 1.4 : 3.4;
  return { r: o.r + dr, c: o.c + dc };
}

/** الخانات الآمنة: البدايات + خانات النجمة */
export const SAFE_CELLS = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
export const STAR_CELLS = new Set<number>([8, 21, 34, 47]);

/** تحويل موقع القطعة إلى خانة على المسار الرئيسي، أو null */
export function trackCellIndex(color: ColorId, pos: number): number | null {
  if (pos < 0 || pos > 50) return null;
  return (START_INDEX[color] + pos) % 52;
}

/** إحداثيات القطعة على الشبكة */
export function cellOf(color: ColorId, pos: number, slot: number): Cell {
  if (pos < 0) return baseSlot(color, slot);
  if (pos <= 50) return TRACK[trackCellIndex(color, pos)!];
  if (pos <= 55) return HOME_PATH[color][pos - 51];
  return CENTER;
}

export const COLOR_LABEL: Record<ColorId, string> = {
  red: "الأحمر",
  green: "الأخضر",
  yellow: "الأصفر",
  blue: "الأزرق",
};

export const COLOR_VAR: Record<ColorId, string> = {
  red: "var(--player-red)",
  green: "var(--player-green)",
  yellow: "var(--player-yellow)",
  blue: "var(--player-blue)",
};
