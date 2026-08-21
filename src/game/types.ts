export type ColorId = "red" | "green" | "yellow" | "blue";

export type SeatKind = "human" | "ai" | "off";

export type Difficulty = "easy" | "medium" | "hard";

export interface PlayerConfig {
  color: ColorId;
  name: string;
  kind: Exclude<SeatKind, "off">;
  difficulty: Difficulty;
  avatar: string;
}

export interface Token {
  id: string;
  color: ColorId;
  /** -1 = في البيت، 0..50 = المسار الرئيسي، 51..55 = ممر البيت، 56 = وصل */
  pos: number;
}

export type Phase = "waiting" | "rolling" | "choose" | "moving" | "over";

export interface Bubble {
  color: ColorId;
  text: string;
  at: number;
}

export interface GameState {
  players: PlayerConfig[];
  tokens: Token[];
  turnIndex: number;
  dice: number | null;
  phase: Phase;
  sixStreak: number;
  legal: string[];
  ranking: ColorId[];
  lastCapture: { cell: number; at: number } | null;
  bubbles: Bubble[];
  log: string;
}

export interface MatchConfig {
  players: PlayerConfig[];
}

export const FINISHED = 56;
export const HOME_START = 51;
