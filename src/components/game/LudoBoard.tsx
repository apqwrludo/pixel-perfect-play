import { useMemo } from "react";
import {
  BASE_ORIGIN,
  CENTER,
  COLORS,
  COLOR_VAR,
  HOME_PATH,
  SAFE_CELLS,
  STAR_CELLS,
  START_INDEX,
  TRACK,
  cellOf,
  trackCellIndex,
} from "@/game/board";
import type { ColorId, GameState } from "@/game/types";
import { FINISHED } from "@/game/types";

const S = 15; // شبكة 15×15
const U = 100 / S; // حجم الخانة بالنسبة المئوية من 100

interface Props {
  state: GameState;
  animating: string | null;
  animPos: number | null;
  onTokenClick: (id: string) => void;
  tokenStyle: string;
}

function colorOfTrackCell(i: number): ColorId | null {
  for (const c of COLORS) {
    if (START_INDEX[c] === i) return c;
  }
  return null;
}

export function LudoBoard({ state, animating, animPos, onTokenClick, tokenStyle }: Props) {
  const tokens = useMemo(() => {
    // ترتيب القطع داخل كل بيت + إزاحة القطع المتكدسة على نفس الخانة
    const baseSlotByToken = new Map<string, number>();
    for (const color of COLORS) {
      const list = state.tokens.filter((t) => t.color === color);
      list.forEach((t, i) => baseSlotByToken.set(t.id, i));
    }

    const occupancy = new Map<string, string[]>();
    for (const t of state.tokens) {
      const pos = animating === t.id && animPos !== null ? animPos : t.pos;
      const key = pos < 0 ? `base-${t.id}` : `p-${t.color}-${pos}`;
      const cellKey =
        pos >= 0 && pos <= 50 ? `c-${trackCellIndex(t.color, pos)}` : key;
      const arr = occupancy.get(cellKey) ?? [];
      arr.push(t.id);
      occupancy.set(cellKey, arr);
    }

    return state.tokens.map((t) => {
      const pos = animating === t.id && animPos !== null ? animPos : t.pos;
      const cell = cellOf(t.color, pos, baseSlotByToken.get(t.id) ?? 0);
      const cellKey = pos >= 0 && pos <= 50 ? `c-${trackCellIndex(t.color, pos)}` : `base-${t.id}`;
      const group = occupancy.get(cellKey) ?? [t.id];
      const idx = group.indexOf(t.id);
      const spread = group.length > 1 && pos >= 0 && pos <= 50 ? 0.22 : 0;
      const dx = spread ? (idx - (group.length - 1) / 2) * spread : 0;
      return {
        token: t,
        pos,
        x: (cell.c + 0.5 + dx) * U,
        y: (cell.r + 0.5 - (spread ? Math.abs(dx) * 0.35 : 0)) * U,
        stacked: group.length > 1 && pos >= 0 && pos <= 50 ? group.length : 0,
        isFirstOfStack: idx === 0,
      };
    });
  }, [state.tokens, animating, animPos]);

  const legal = new Set(state.legal);
  const captureFresh =
    state.lastCapture && Date.now() - state.lastCapture.at < 900 ? state.lastCapture.cell : null;

  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" role="img" aria-label="لوح اللودو">
        <defs>
          <linearGradient id="boardBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.33 0.14 306)" />
            <stop offset="100%" stopColor="oklch(0.2 0.1 302)" />
          </linearGradient>
          <linearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.94 0.1 95)" />
            <stop offset="55%" stopColor="oklch(0.82 0.16 86)" />
            <stop offset="100%" stopColor="oklch(0.6 0.14 70)" />
          </linearGradient>
          {COLORS.map((c) => (
            <radialGradient id={`grad-${c}`} key={c} cx="35%" cy="28%" r="80%">
              <stop offset="0%" stopColor="oklch(1 0 0 / 0.55)" />
              <stop offset="45%" stopColor={COLOR_VAR[c]} />
              <stop offset="100%" stopColor="oklch(0.22 0.05 300 / 0.9)" />
            </radialGradient>
          ))}
          <filter id="tokenShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.45" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* خلفية اللوح */}
        <rect x="0" y="0" width="100" height="100" rx="4" fill="url(#boardBg)" />
        <rect
          x="0.6"
          y="0.6"
          width="98.8"
          height="98.8"
          rx="3.6"
          fill="none"
          stroke="url(#goldEdge)"
          strokeWidth="1.1"
        />

        {/* بيوت الألوان */}
        {COLORS.map((c) => {
          const o = BASE_ORIGIN[c];
          return (
            <g key={`base-${c}`}>
              <rect
                x={o.c * U + 1}
                y={o.r * U + 1}
                width={6 * U - 2}
                height={6 * U - 2}
                rx="2.5"
                fill={COLOR_VAR[c]}
                opacity="0.9"
              />
              <rect
                x={o.c * U + 1}
                y={o.r * U + 1}
                width={6 * U - 2}
                height={6 * U - 2}
                rx="2.5"
                fill="none"
                stroke="url(#goldEdge)"
                strokeWidth="0.5"
              />
              <rect
                x={o.c * U + 2.6}
                y={o.r * U + 2.6}
                width={6 * U - 5.2}
                height={6 * U - 5.2}
                rx="1.8"
                fill="oklch(0.98 0.01 90 / 0.92)"
              />
              {[0, 1, 2, 3].map((i) => {
                const dr = i < 2 ? 1.4 : 3.4;
                const dc = i % 2 === 0 ? 1.4 : 3.4;
                return (
                  <circle
                    key={i}
                    cx={(o.c + dc + 0.5) * U}
                    cy={(o.r + dr + 0.5) * U}
                    r={U * 0.52}
                    fill={COLOR_VAR[c]}
                    opacity="0.25"
                    stroke={COLOR_VAR[c]}
                    strokeWidth="0.35"
                  />
                );
              })}
            </g>
          );
        })}

        {/* خانات المسار */}
        {TRACK.map((cell, i) => {
          const startColor = colorOfTrackCell(i);
          const safe = SAFE_CELLS.has(i);
          const star = STAR_CELLS.has(i);
          const flash = captureFresh === i;
          return (
            <g key={`t-${i}`}>
              <rect
                x={cell.c * U + 0.25}
                y={cell.r * U + 0.25}
                width={U - 0.5}
                height={U - 0.5}
                rx="0.9"
                fill={startColor ? COLOR_VAR[startColor] : "oklch(0.98 0.01 90 / 0.95)"}
                stroke="oklch(0.3 0.06 300 / 0.5)"
                strokeWidth="0.18"
              />
              {safe && !startColor && (
                <path
                  d={starPath(cell.c * U + U / 2, cell.r * U + U / 2, U * 0.3, U * 0.13)}
                  fill="oklch(0.7 0.13 74 / 0.75)"
                />
              )}
              {star && null}
              {flash && (
                <circle
                  cx={cell.c * U + U / 2}
                  cy={cell.r * U + U / 2}
                  r={U * 0.6}
                  fill="oklch(0.85 0.2 40 / 0.55)"
                />
              )}
            </g>
          );
        })}

        {/* ممرات البيوت */}
        {COLORS.map((c) =>
          HOME_PATH[c].map((cell, i) => (
            <rect
              key={`h-${c}-${i}`}
              x={cell.c * U + 0.25}
              y={cell.r * U + 0.25}
              width={U - 0.5}
              height={U - 0.5}
              rx="0.9"
              fill={COLOR_VAR[c]}
              opacity="0.88"
              stroke="oklch(0.98 0.02 90 / 0.35)"
              strokeWidth="0.2"
            />
          )),
        )}

        {/* المركز */}
        <g>
          <rect
            x={(CENTER.c - 1) * U + 0.3}
            y={(CENTER.r - 1) * U + 0.3}
            width={3 * U - 0.6}
            height={3 * U - 0.6}
            rx="1.4"
            fill="oklch(0.98 0.01 90 / 0.95)"
          />
          <polygon
            points={`${(CENTER.c - 1) * U},${(CENTER.r - 1) * U} ${(CENTER.c + 2) * U},${(CENTER.r - 1) * U} ${(CENTER.c + 0.5) * U},${(CENTER.r + 0.5) * U}`}
            fill={COLOR_VAR.green}
          />
          <polygon
            points={`${(CENTER.c + 2) * U},${(CENTER.r - 1) * U} ${(CENTER.c + 2) * U},${(CENTER.r + 2) * U} ${(CENTER.c + 0.5) * U},${(CENTER.r + 0.5) * U}`}
            fill={COLOR_VAR.yellow}
          />
          <polygon
            points={`${(CENTER.c + 2) * U},${(CENTER.r + 2) * U} ${(CENTER.c - 1) * U},${(CENTER.r + 2) * U} ${(CENTER.c + 0.5) * U},${(CENTER.r + 0.5) * U}`}
            fill={COLOR_VAR.blue}
          />
          <polygon
            points={`${(CENTER.c - 1) * U},${(CENTER.r + 2) * U} ${(CENTER.c - 1) * U},${(CENTER.r - 1) * U} ${(CENTER.c + 0.5) * U},${(CENTER.r + 0.5) * U}`}
            fill={COLOR_VAR.red}
          />
          <path
            d={starPath((CENTER.c + 0.5) * U, (CENTER.r + 0.5) * U, U * 0.85, U * 0.36)}
            fill="url(#goldEdge)"
            stroke="oklch(0.35 0.1 60)"
            strokeWidth="0.25"
          />
        </g>

        {/* القطع */}
        {tokens.map(({ token, pos, x, y, stacked, isFirstOfStack }) => {
          const clickable = legal.has(token.id);
          const finished = pos === FINISHED;
          return (
            <g
              key={token.id}
              transform={`translate(${x} ${y})`}
              style={{
                transition: "transform 0.12s cubic-bezier(.34,1.4,.6,1)",
                cursor: clickable ? "pointer" : "default",
              }}
              onClick={() => clickable && onTokenClick(token.id)}
            >
              {clickable && (
                <circle r={U * 0.62} fill="oklch(0.95 0.15 95 / 0.35)">
                  <animate
                    attributeName="r"
                    values={`${U * 0.5};${U * 0.78};${U * 0.5}`}
                    dur="1.1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <ellipse cx="0" cy={U * 0.34} rx={U * 0.3} ry={U * 0.12} fill="#000" opacity="0.3" />
              <circle
                r={U * (finished ? 0.3 : 0.36)}
                fill={`url(#grad-${token.color})`}
                stroke="url(#goldEdge)"
                strokeWidth={clickable ? 0.4 : 0.24}
                filter="url(#tokenShadow)"
              />
              <circle cx={-U * 0.1} cy={-U * 0.13} r={U * 0.1} fill="oklch(1 0 0 / 0.6)" />
              {tokenStyle === "token-crown" && (
                <path
                  d={`M ${-U * 0.16} ${-U * 0.02} l ${U * 0.08} ${-U * 0.14} l ${U * 0.08} ${U * 0.08} l ${U * 0.08} ${-U * 0.14} l ${U * 0.08} ${U * 0.2} z`}
                  fill="url(#goldEdge)"
                />
              )}
              {tokenStyle === "token-gem" && (
                <path
                  d={`M 0 ${-U * 0.17} L ${U * 0.15} 0 L 0 ${U * 0.17} L ${-U * 0.15} 0 Z`}
                  fill="oklch(0.97 0.05 200 / 0.85)"
                />
              )}
              {stacked > 1 && isFirstOfStack && (
                <>
                  <circle cx={U * 0.3} cy={-U * 0.3} r={U * 0.22} fill="oklch(0.2 0.06 300)" />
                  <text
                    x={U * 0.3}
                    y={-U * 0.23}
                    textAnchor="middle"
                    fontSize={U * 0.3}
                    fill="oklch(0.95 0.1 95)"
                  >
                    {stacked}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"} ${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + "Z";
}
