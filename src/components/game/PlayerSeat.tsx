import { COLOR_LABEL, COLOR_VAR } from "@/game/board";
import type { GameState, PlayerConfig } from "@/game/types";
import { FINISHED } from "@/game/types";
import { cn } from "@/lib/utils";

interface Props {
  player: PlayerConfig;
  state: GameState;
  active: boolean;
  frame: string;
  bubble?: string;
  align: "start" | "end";
}

export function PlayerSeat({ player, state, active, frame, bubble, align }: Props) {
  const done = state.tokens.filter((t) => t.color === player.color && t.pos === FINISHED).length;
  const rank = state.ranking.indexOf(player.color);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-2xl border px-2 py-1.5 transition",
        active
          ? "border-gold bg-card shadow-[0_0_24px_-6px_var(--gold)]"
          : "border-border/60 bg-card/60",
        align === "end" && "flex-row-reverse",
      )}
    >
      {bubble && (
        <div className="animate-pop-in absolute -top-9 right-0 z-10 whitespace-nowrap rounded-xl bg-gold-plate px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-lg">
          {bubble}
        </div>
      )}
      <div
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full text-lg",
          frame === "frame-gold" && "ring-2 ring-gold",
          frame === "frame-royal" && "ring-2 ring-primary-glow shadow-[0_0_16px_var(--primary-glow)]",
        )}
        style={{ background: COLOR_VAR[player.color] }}
      >
        <span>{player.avatar}</span>
        {active && (
          <span className="absolute -inset-1 animate-ping rounded-full border border-gold/70" aria-hidden />
        )}
      </div>
      <div className={cn("min-w-0", align === "end" && "text-left")}>
        <p className="truncate text-xs font-bold">{player.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {rank >= 0 ? `المركز ${rank + 1}` : `${COLOR_LABEL[player.color]} · ${done}/4`}
        </p>
      </div>
    </div>
  );
}
