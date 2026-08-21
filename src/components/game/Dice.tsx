import { useEffect, useState } from "react";
import { DICE_SKINS } from "@/game/shop";
import { cn } from "@/lib/utils";

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

interface Props {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  skin: string;
  onRoll: () => void;
}

export function Dice({ value, rolling, disabled, skin, onRoll }: Props) {
  const [face, setFace] = useState(value ?? 6);
  const s = DICE_SKINS[skin] ?? DICE_SKINS["dice-classic"];

  useEffect(() => {
    if (rolling) {
      const id = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 70);
      return () => clearInterval(id);
    }
    if (value) setFace(value);
  }, [rolling, value]);

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      aria-label="ارمِ النرد"
      className={cn(
        "relative grid size-20 place-items-center rounded-2xl transition",
        disabled ? "opacity-70" : "active:scale-95",
      )}
    >
      {!disabled && (
        <span className="absolute inset-0 animate-ping rounded-2xl bg-gold/25" aria-hidden />
      )}
      <svg
        viewBox="0 0 100 100"
        className={cn("size-20 drop-shadow-[0_8px_16px_oklch(0_0_0/0.6)]", rolling && "animate-dice-tumble")}
      >
        <defs>
          <linearGradient id={`dice-${skin}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={s.a} />
            <stop offset="100%" stopColor={s.b} />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="88" height="88" rx="20" fill={`url(#dice-${skin})`} />
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="20"
          fill="none"
          stroke="oklch(0.9 0.1 90 / 0.8)"
          strokeWidth="2.5"
        />
        <rect x="14" y="13" width="72" height="26" rx="13" fill="oklch(1 0 0 / 0.25)" />
        {PIPS[face].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="8.5" fill={s.pip} />
        ))}
      </svg>
    </button>
  );
}
