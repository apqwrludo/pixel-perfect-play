import { SAFE_CELLS, trackCellIndex } from "./board";
import { applyMove, canMove } from "./rules";
import type { Difficulty, GameState, Token } from "./types";
import { FINISHED, HOME_START } from "./types";

/** خطر التعرّض للأكل على خانة معيّنة (احتمال تقريبي) */
function dangerAt(state: GameState, tokens: Token[], token: Token): number {
  const ci = trackCellIndex(token.color, token.pos);
  if (ci === null) return 0;
  if (SAFE_CELLS.has(ci)) return 0;
  let risk = 0;
  for (const enemy of tokens) {
    if (enemy.color === token.color) continue;
    const ei = trackCellIndex(enemy.color, enemy.pos);
    if (ei === null) continue;
    const gap = (ci - ei + 52) % 52;
    if (gap >= 1 && gap <= 6) risk += 1;
  }
  return risk;
}

function scoreMove(
  state: GameState,
  tokenId: string,
  die: number,
  difficulty: Difficulty,
): number {
  const before = state.tokens.find((t) => t.id === tokenId)!;
  const result = applyMove(state, tokenId, die);
  const after = result.tokens.find((t) => t.id === tokenId)!;

  let score = die * 0.4;

  if (result.reachedHome) score += 120;
  if (result.captured.length > 0) score += 90 * result.captured.length;
  if (before.pos < 0) score += 55; // إخراج قطعة من البيت
  if (after.pos >= HOME_START && after.pos < FINISHED) score += 35; // دخل ممر البيت
  if (result.finishedColor) score += 400;

  if (difficulty === "easy") {
    return score + Math.random() * 60;
  }

  // تجنّب الخطر بعد الحركة
  const riskAfter = dangerAt(state, result.tokens, after);
  const riskBefore = dangerAt(state, state.tokens, before);
  score -= riskAfter * (difficulty === "hard" ? 22 : 12);
  score += riskBefore * (difficulty === "hard" ? 14 : 7);

  // مكافأة تكوين حاجز
  const ci = trackCellIndex(after.color, after.pos);
  if (ci !== null) {
    const mates = result.tokens.filter(
      (t) => t.color === after.color && t.id !== after.id && trackCellIndex(t.color, t.pos) === ci,
    ).length;
    if (mates >= 1) score += difficulty === "hard" ? 26 : 12;
    if (SAFE_CELLS.has(ci)) score += 10;
  }

  if (difficulty === "medium") score += Math.random() * 18;
  return score;
}

export function chooseAiMove(
  state: GameState,
  die: number,
  difficulty: Difficulty,
): string | null {
  const color = state.players[state.turnIndex].color;
  const options = state.tokens
    .filter((t) => t.color === color && canMove(state, t, die))
    .map((t) => t.id);
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];

  let best = options[0];
  let bestScore = -Infinity;
  for (const id of options) {
    const s = scoreMove(state, id, die, difficulty);
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return best;
}
