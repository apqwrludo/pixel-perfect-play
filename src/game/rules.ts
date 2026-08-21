import { SAFE_CELLS, START_INDEX, trackCellIndex } from "./board";
import type { ColorId, GameState, PlayerConfig, Token } from "./types";
import { FINISHED } from "./types";

export function createTokens(players: PlayerConfig[]): Token[] {
  return players.flatMap((p) =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `${p.color}-${i}`,
      color: p.color,
      pos: -1,
    })),
  );
}

export function createGame(players: PlayerConfig[]): GameState {
  return {
    players,
    tokens: createTokens(players),
    turnIndex: 0,
    dice: null,
    phase: "waiting",
    sixStreak: 0,
    legal: [],
    ranking: [],
    lastCapture: null,
    bubbles: [],
    log: "",
  };
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** الخانات التي عليها حاجز (قطعتان أو أكثر لنفس اللون على المسار الرئيسي) */
export function blockedCells(tokens: Token[], mover: ColorId): Set<number> {
  const counts = new Map<number, Map<ColorId, number>>();
  for (const t of tokens) {
    const ci = trackCellIndex(t.color, t.pos);
    if (ci === null) continue;
    if (!counts.has(ci)) counts.set(ci, new Map());
    const m = counts.get(ci)!;
    m.set(t.color, (m.get(t.color) ?? 0) + 1);
  }
  const blocked = new Set<number>();
  for (const [ci, m] of counts) {
    for (const [color, n] of m) {
      if (color !== mover && n >= 2) blocked.add(ci);
    }
  }
  return blocked;
}

/** هل يمكن تحريك هذه القطعة بهذا الرقم؟ */
export function canMove(state: GameState, token: Token, die: number): boolean {
  if (token.pos === FINISHED) return false;
  if (token.pos < 0) {
    if (die !== 6) return false;
    const target = trackCellIndex(token.color, 0)!;
    const blocked = blockedCells(state.tokens, token.color);
    if (blocked.has(target)) return false;
    // لا نضع أكثر من قطعتين لنفس اللون على البداية
    return true;
  }
  const next = token.pos + die;
  if (next > FINISHED) return false;

  const blocked = blockedCells(state.tokens, token.color);
  // لا يمكن تجاوز أو النزول على حاجز
  for (let step = token.pos + 1; step <= Math.min(next, 50); step++) {
    const ci = trackCellIndex(token.color, step)!;
    if (blocked.has(ci)) return false;
  }
  return true;
}

export function legalMovesFor(state: GameState, color: ColorId, die: number): string[] {
  return state.tokens
    .filter((t) => t.color === color && canMove(state, t, die))
    .map((t) => t.id);
}

export interface MoveResult {
  tokens: Token[];
  captured: Token[];
  captureCell: number | null;
  reachedHome: boolean;
  finishedColor: ColorId | null;
}

export function applyMove(state: GameState, tokenId: string, die: number): MoveResult {
  const tokens = state.tokens.map((t) => ({ ...t }));
  const token = tokens.find((t) => t.id === tokenId)!;
  token.pos = token.pos < 0 ? 0 : token.pos + die;

  const captured: Token[] = [];
  let captureCell: number | null = null;

  const ci = trackCellIndex(token.color, token.pos);
  if (ci !== null && !SAFE_CELLS.has(ci)) {
    for (const other of tokens) {
      if (other.color === token.color) continue;
      if (trackCellIndex(other.color, other.pos) === ci) {
        other.pos = -1;
        captured.push(other);
        captureCell = ci;
      }
    }
  }

  const colorTokens = tokens.filter((t) => t.color === token.color);
  const finishedColor = colorTokens.every((t) => t.pos === FINISHED) ? token.color : null;

  return {
    tokens,
    captured,
    captureCell,
    reachedHome: token.pos === FINISHED,
    finishedColor,
  };
}

export function nextTurnIndex(state: GameState, from: number): number {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (!state.ranking.includes(state.players[idx].color)) return idx;
  }
  return from;
}

/** كم خطوة تقدّم لهذا اللون */
export function progressOf(tokens: Token[], color: ColorId): number {
  return tokens
    .filter((t) => t.color === color)
    .reduce((sum, t) => sum + (t.pos < 0 ? 0 : t.pos + 1), 0);
}

export function startCellOf(color: ColorId): number {
  return START_INDEX[color];
}
