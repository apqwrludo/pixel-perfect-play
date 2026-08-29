import { useCallback, useEffect, useRef, useState } from "react";
import { chooseAiMove } from "@/game/ai";
import { applyMove, createGame, legalMovesFor, nextTurnIndex, rollDie } from "@/game/rules";
import type { ColorId, GameState, PlayerConfig } from "@/game/types";
import { buzz, sfx } from "@/lib/sound";

const AI_ROLL_DELAY = 750;
const AI_MOVE_DELAY = 650;
const STEP_MS = 130;
export const TURN_SECONDS = 20;

export interface UseLudoGame {
  state: GameState;
  animating: string | null;
  animPos: number | null;
  timeLeft: number;
  roll: () => void;
  move: (tokenId: string) => void;
  sendBubble: (color: ColorId, text: string) => void;
  restart: () => void;
  vibrateOn: boolean;
}

export interface OnlineOptions {
  /** الألوان التي يتحكم بها هذا الجهاز */
  myColors: ColorId[];
  /** هل هذا الجهاز هو المضيف (يدير حركات الكمبيوتر)؟ */
  isHost: boolean;
  /** آخر حالة واردة من الخادم */
  remote: { rev: number; state: GameState } | null;
  /** إرسال الحالة بعد كل حركة محلية */
  publish: (state: GameState) => void;
}

export function useLudoGame(
  players: PlayerConfig[],
  vibrateOn: boolean,
  online?: OnlineOptions,
): UseLudoGame {
  const [state, setState] = useState<GameState>(() => createGame(players));
  const [animating, setAnimating] = useState<string | null>(null);
  const [animPos, setAnimPos] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const restart = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setAnimating(null);
    setAnimPos(null);
    setTimeLeft(TURN_SECONDS);
    setState(createGame(players));
  }, [players]);

  const endTurn = useCallback(
    (extra: boolean, die: number) => {
      setState((s) => {
        if (s.phase === "over") return s;
        const streak = die === 6 ? s.sixStreak + 1 : 0;
        const keep = extra && streak < 3;
        return {
          ...s,
          dice: null,
          legal: [],
          phase: "waiting",
          sixStreak: keep ? streak : 0,
          turnIndex: keep ? s.turnIndex : nextTurnIndex(s, s.turnIndex),
          log: streak >= 3 && die === 6 ? "ثلاث ستات! يسقط الدور" : s.log,
        };
      });
      setTimeLeft(TURN_SECONDS);
      busy.current = false;
    },
    [],
  );

  const performMove = useCallback(
    (tokenId: string) => {
      setState((s) => {
        if (s.phase !== "choose" || s.dice === null || !s.legal.includes(tokenId)) return s;
        const die = s.dice;
        const token = s.tokens.find((t) => t.id === tokenId)!;
        const from = token.pos;
        const to = token.pos < 0 ? 0 : token.pos + die;
        const steps = token.pos < 0 ? 1 : die;

        setAnimating(tokenId);
        // تحريك خانة خانة
        for (let i = 1; i <= steps; i++) {
          later(() => {
            setAnimPos(from < 0 ? 0 : from + i);
            sfx.step();
            if (vibrateOn && i === steps) buzz(12);
          }, i * STEP_MS);
        }

        later(
          () => {
            setState((cur) => {
              const result = applyMove(cur, tokenId, die);
              if (result.captured.length) {
                sfx.capture();
                if (vibrateOn) buzz([25, 40, 25]);
              } else if (result.reachedHome) {
                sfx.home();
              }
              const ranking = result.finishedColor
                ? [...cur.ranking, result.finishedColor]
                : cur.ranking;
              const remaining = cur.players.filter((p) => !ranking.includes(p.color));
              const over = remaining.length <= 1;
              if (result.finishedColor) sfx.win();

              const extra = die === 6 || result.captured.length > 0 || result.reachedHome;
              const next: GameState = {
                ...cur,
                tokens: result.tokens,
                ranking:
                  over && remaining.length === 1 ? [...ranking, remaining[0].color] : ranking,
                lastCapture: result.captureCell !== null
                  ? { cell: result.captureCell, at: Date.now() }
                  : cur.lastCapture,
                phase: over ? "over" : cur.phase,
                log: result.captured.length
                  ? "أكلة! رجعت القطعة للبيت"
                  : result.reachedHome
                    ? "قطعة وصلت البيت 🎉"
                    : cur.log,
              };
              if (!over) {
                later(() => endTurn(extra, die), 60);
              } else {
                busy.current = false;
              }
              return next;
            });
            setAnimating(null);
            setAnimPos(null);
          },
          steps * STEP_MS + 90,
        );

        return { ...s, phase: "moving", legal: [] };
      });
    },
    [endTurn, later, vibrateOn],
  );

  const roll = useCallback(() => {
    setState((s) => {
      if (s.phase !== "waiting") return s;
      busy.current = true;
      sfx.dice();
      if (vibrateOn) buzz(18);
      const die = rollDie();
      const color = s.players[s.turnIndex].color;
      const legal = legalMovesFor(s, color, die);
      if (legal.length === 0) {
        later(() => endTurn(die === 6, die), 900);
        return { ...s, dice: die, phase: "rolling", legal: [], log: "ما فيه حركة ممكنة" };
      }
      if (legal.length === 1) {
        later(() => performMove(legal[0]), 620);
      }
      return { ...s, dice: die, phase: "choose", legal, log: "" };
    });
    setTimeLeft(TURN_SECONDS);
  }, [endTurn, later, performMove, vibrateOn]);

  const move = useCallback(
    (tokenId: string) => {
      sfx.tap();
      performMove(tokenId);
    },
    [performMove],
  );

  // دور الكمبيوتر
  useEffect(() => {
    if (state.phase === "over") return;
    const player = state.players[state.turnIndex];
    if (!player || player.kind !== "ai") return;
    if (state.phase === "waiting") {
      const t = setTimeout(roll, AI_ROLL_DELAY);
      return () => clearTimeout(t);
    }
    if (state.phase === "choose" && state.dice !== null && state.legal.length > 1) {
      const die = state.dice;
      const t = setTimeout(() => {
        const pick = chooseAiMove(state, die, player.difficulty);
        if (pick) performMove(pick);
      }, AI_MOVE_DELAY);
      return () => clearTimeout(t);
    }
  }, [state, roll, performMove]);

  // مؤقّت الدور للاعب البشري
  useEffect(() => {
    if (state.phase === "over") return;
    const player = state.players[state.turnIndex];
    if (!player || player.kind !== "human") return;
    if (state.phase !== "waiting" && state.phase !== "choose") return;
    const id = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (state.phase === "waiting") roll();
          else if (state.legal.length) performMove(state.legal[0]);
          return TURN_SECONDS;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.phase, state.turnIndex, state.legal, state.players, roll, performMove]);

  const sendBubble = useCallback((color: ColorId, text: string) => {
    sfx.tap();
    const at = Date.now();
    setState((s) => ({
      ...s,
      bubbles: [...s.bubbles.filter((b) => b.color !== color), { color, text, at }],
    }));
    setTimeout(() => {
      setState((s) => ({ ...s, bubbles: s.bubbles.filter((b) => b.at !== at) }));
    }, 3000);
  }, []);

  return { state, animating, animPos, timeLeft, roll, move, sendBubble, restart, vibrateOn };
}
