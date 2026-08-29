import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { Home as HomeIcon, RotateCcw, Timer, Wifi } from "lucide-react";
import { ChatBar } from "@/components/game/ChatBar";
import { Confetti } from "@/components/game/Confetti";
import { Dice } from "@/components/game/Dice";
import { LudoBoard } from "@/components/game/LudoBoard";
import { PlayerSeat } from "@/components/game/PlayerSeat";
import { COLOR_LABEL } from "@/game/board";
import type { ColorId, PlayerConfig } from "@/game/types";
import { TURN_SECONDS, useLudoGame, type OnlineOptions } from "@/hooks/useLudoGame";
import { useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";

interface Props {
  players: PlayerConfig[];
  online?: OnlineOptions;
  /** رمز الغرفة عند اللعب أونلاين */
  roomCode?: string;
}

export function GameTable({ players, online, roomCode }: Props) {
  const { profile, update } = useProfile();
  const navigate = useNavigate();
  const game = useLudoGame(players, profile.vibrate, online);
  const { state, animating, animPos, timeLeft, roll, move, sendBubble, restart } = game;
  const recorded = useRef(false);

  const myColors: ColorId[] = online?.myColors ?? [];
  const me = useMemo(
    () =>
      online
        ? players.find((p) => myColors.includes(p.color))
        : players.find((p) => p.kind === "human"),
    [online, players, myColors],
  );
  const current = state.players[state.turnIndex];
  const myTurn = online ? !!current && myColors.includes(current.color) : current?.kind === "human";
  const winner = state.ranking[0];

  useEffect(() => {
    if (state.phase !== "over" || recorded.current) return;
    recorded.current = true;
    const won = me ? state.ranking[0] === me.color : false;
    const reward = won ? 500 : 120;
    sfx.coin();
    update((p) => ({
      coins: p.coins + reward,
      games: p.games + 1,
      wins: p.wins + (won ? 1 : 0),
    }));
  }, [state.phase, state.ranking, me, update]);

  const playAgain = () => {
    recorded.current = false;
    sfx.tap();
    restart();
  };

  const bubbleOf = (color: string) => state.bubbles.find((b) => b.color === color)?.text;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-5 pt-4">
      <header className="flex items-center justify-between gap-2">
        <Link
          to="/"
          aria-label="الخروج للقائمة"
          className="grid size-9 place-items-center rounded-full border border-gold/50 bg-card text-gold"
        >
          <HomeIcon className="size-4" />
        </Link>
        {roomCode && (
          <span className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-card/70 px-3 py-1 text-xs text-gold">
            <Wifi className="size-3.5" />
            {roomCode}
          </span>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-card/70 px-3 py-1 text-sm">
          <Timer className="size-4 text-gold" />
          <span className="tabular-nums text-gold">{myTurn ? timeLeft : TURN_SECONDS}</span>
        </div>
        {online ? (
          <span className="size-9" />
        ) : (
          <button
            type="button"
            onClick={playAgain}
            aria-label="إعادة المباراة"
            className="grid size-9 place-items-center rounded-full border border-gold/50 bg-card text-gold"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {state.players.slice(0, 2).map((p, i) => (
          <PlayerSeat
            key={p.color}
            player={p}
            state={state}
            active={current?.color === p.color}
            frame={me?.color === p.color ? profile.frame : "frame-none"}
            bubble={bubbleOf(p.color)}
            align={i === 0 ? "start" : "end"}
          />
        ))}
      </div>

      <div className="mt-3">
        <LudoBoard
          state={state}
          animating={animating}
          animPos={animPos}
          onTokenClick={move}
          tokenStyle={profile.tokenStyle}
        />
      </div>

      {state.players.length > 2 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {state.players.slice(2).map((p, i) => (
            <PlayerSeat
              key={p.color}
              player={p}
              state={state}
              active={current?.color === p.color}
              frame={me?.color === p.color ? profile.frame : "frame-none"}
              bubble={bubbleOf(p.color)}
              align={i === 0 ? "start" : "end"}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <ChatBar
          onSend={(text) => me && sendBubble(me.color, text)}
          disabled={state.phase === "over"}
        />
        <p className="flex-1 text-center text-xs text-muted-foreground">
          {state.log ||
            (state.phase === "over"
              ? "انتهت المباراة"
              : myTurn
                ? state.phase === "choose"
                  ? "اختر القطعة"
                  : "دورك — ارمِ النرد"
                : `دور ${current?.name ?? ""}`)}
        </p>
        <Dice
          value={state.dice}
          rolling={state.phase === "rolling"}
          disabled={!myTurn || state.phase !== "waiting"}
          skin={profile.dice}
          onRoll={roll}
        />
      </div>

      {state.phase === "over" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-6 backdrop-blur-sm">
          <Confetti />
          <div className="animate-pop-in w-full max-w-xs rounded-3xl border border-gold/60 bg-card p-6 text-center shadow-[var(--shadow-plate)]">
            <h2 className="text-gold-plate text-4xl">
              {me && winner === me.color ? "فزت!" : "انتهت المباراة"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              الفائز: {state.players.find((p) => p.color === winner)?.name ?? COLOR_LABEL[winner]}
            </p>
            <ol className="mt-4 space-y-1 text-sm">
              {state.ranking.map((c, i) => (
                <li key={c} className="flex justify-between rounded-lg bg-secondary/60 px-3 py-1.5">
                  <span>{state.players.find((p) => p.color === c)?.name ?? COLOR_LABEL[c]}</span>
                  <span className="text-gold">#{i + 1}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex gap-2">
              {!online && (
                <button
                  type="button"
                  onClick={playAgain}
                  className="flex-1 rounded-2xl bg-velvet-plate py-3 font-bold text-velvet-foreground ring-1 ring-gold/60 active:scale-95"
                >
                  مباراة جديدة
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="flex-1 rounded-2xl border border-gold/50 py-3 font-bold text-gold active:scale-95"
              >
                القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
