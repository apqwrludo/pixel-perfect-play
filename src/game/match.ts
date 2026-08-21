import { COLOR_LABEL } from "@/game/board";
import type { ColorId, Difficulty, PlayerConfig, SeatKind } from "@/game/types";

const KEY = "ludo-genius-match-v1";

export const SEAT_ORDER: ColorId[] = ["red", "green", "yellow", "blue"];

export const AVATARS: Record<ColorId, string> = {
  red: "🦊",
  green: "🐢",
  yellow: "🦁",
  blue: "🐬",
};

export const AI_NAMES: Record<ColorId, string> = {
  red: "أبو ناصر",
  green: "سلمى",
  yellow: "الأسد",
  blue: "بحّار",
};

export interface SeatSetup {
  color: ColorId;
  kind: SeatKind;
  difficulty: Difficulty;
  name: string;
}

export function defaultSeats(playerName: string): SeatSetup[] {
  return SEAT_ORDER.map((color, i) => ({
    color,
    kind: i === 0 ? "human" : "ai",
    difficulty: "medium",
    name: i === 0 ? playerName : AI_NAMES[color],
  }));
}

export function toPlayers(seats: SeatSetup[]): PlayerConfig[] {
  return seats
    .filter((s) => s.kind !== "off")
    .map((s) => ({
      color: s.color,
      name: s.name || COLOR_LABEL[s.color],
      kind: s.kind as "human" | "ai",
      difficulty: s.difficulty,
      avatar: AVATARS[s.color],
    }));
}

export function saveMatch(players: PlayerConfig[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(players));
  } catch {
    /* noop */
  }
}

export function loadMatch(): PlayerConfig[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerConfig[];
    return Array.isArray(parsed) && parsed.length >= 2 ? parsed : null;
  } catch {
    return null;
  }
}
