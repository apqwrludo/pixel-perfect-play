import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Home as HomeIcon, RotateCcw, Timer } from "lucide-react";
import { ChatBar } from "@/components/game/ChatBar";
import { Confetti } from "@/components/game/Confetti";
import { Dice } from "@/components/game/Dice";
import { LudoBoard } from "@/components/game/LudoBoard";
import { PlayerSeat } from "@/components/game/PlayerSeat";
import { COLOR_LABEL } from "@/game/board";
import { defaultSeats, loadMatch, toPlayers } from "@/game/match";
import type { PlayerConfig } from "@/game/types";
import { TURN_SECONDS, useLudoGame } from "@/hooks/useLudoGame";
import { useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "طاولة اللعب — عبقري اللودو" },
      {
        name: "description",
        content: "طاولة لودو كاملة: ارمِ النرد، حرّك قطعك، كل قطع الخصوم وادخل البيت أولًا.",
      },
      { property: "og:title", content: "طاولة اللعب — عبقري اللودو" },
      {
        property: "og:description",
        content: "مباراة لودو مباشرة بأربعة مقاعد ونرد متحرك ودردشة سريعة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const [players, setPlayers] = useState<PlayerConfig[] | null>(null);

  useEffect(() => {
    setPlayers(loadMatch() ?? toPlayers(defaultSeats("أنت")));
  }, []);

  if (!players) {
    return (
      <main className="grid min-h-dvh place-items-center text-gold">
        <p className="animate-pulse text-lg">جاري تجهيز الطاولة…</p>
      </main>
    );
  }
  return <Table players={players} />;
}

function Table({ players }: { players: PlayerConfig[] }) {
  const { profile, update } = useProfile();
  const navigate = useNavigate();
  const game = useLudoGame(players, profile.vibrate);
  const { state, animating, animPos, timeLeft, roll, move, sendBubble, restart } = game;
  const recorded = useRef(false);

  const human = useMemo(() => players.find((p) => p.kind === "human"), [players]);
  const current = state.players[state.turnIndex];
  const isHumanTurn = current?.kind === "human";
  const winner = state.ranking[0];

  useEffect(() => {
    if (state.phase !== "over" || recorded.current) return;
    recorded.current = true;
    const won = human ? state.ranking[0] === human.color : false;
    const reward = won ? 500 : 120;
    sfx.coin();
    update((p) => ({
      coins: p.coins + reward,
      games: p.games + 1,
      wins: p.wins + (won ? 1 : 0),
    }));
  }, [state.phase, state.ranking, human, update]);

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
        <div className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-card/70 px-3 py-1 text-sm">
          <Timer className="size-4 text-gold" />
          <span className="tabular-nums text-gold">{isHumanTurn ? timeLeft : TURN_SECONDS}</span>
        </div>
        <button
          type="button"
          onClick={playAgain}
          aria-label="إعادة المباراة"
          className="grid size-9 place-items-center rounded-full border border-gold/50 bg-card text-gold"
        >
          <RotateCcw className="size-4" />
        </button>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {state.players.slice(0, 2).map((p, i) => (
          <PlayerSeat
            key={p.color}
            player={p}
            state={state}
            active={state.players[state.turnIndex]?.color === p.color}
            frame={p.kind === "human" ? profile.frame : "frame-none"}
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
              active={state.players[state.turnIndex]?.color === p.color}
              frame={p.kind === "human" ? profile.frame : "frame-none"}
              bubble={bubbleOf(p.color)}
              align={i === 0 ? "start" : "end"}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <ChatBar
          onSend={(text) => human && sendBubble(human.color, text)}
          disabled={state.phase === "over"}
        />
        <p className="flex-1 text-center text-xs text-muted-foreground">
          {state.log ||
            (state.phase === "over"
              ? "انتهت المباراة"
              : isHumanTurn
                ? state.phase === "choose"
                  ? "اختر القطعة"
                  : "دورك — ارمِ النرد"
                : `دور ${current?.name ?? ""}`)}
        </p>
        <Dice
          value={state.dice}
          rolling={state.phase === "rolling"}
          disabled={!isHumanTurn || state.phase !== "waiting"}
          skin={profile.dice}
          onRoll={roll}
        />
      </div>

      {state.phase === "over" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-6 backdrop-blur-sm">
          <Confetti />
          <div className="animate-pop-in w-full max-w-xs rounded-3xl border border-gold/60 bg-card p-6 text-center shadow-[var(--shadow-plate)]">
            <h2 className="text-gold-plate text-4xl">
              {human && winner === human.color ? "فزت!" : "انتهت المباراة"}
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
              <button
                type="button"
                onClick={playAgain}
                className="flex-1 rounded-2xl bg-velvet-plate py-3 font-bold text-velvet-foreground ring-1 ring-gold/60 active:scale-95"
              >
                مباراة جديدة
              </button>
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
