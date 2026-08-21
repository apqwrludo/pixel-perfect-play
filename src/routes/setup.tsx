import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, Play, User, UserX } from "lucide-react";
import { COLOR_LABEL, COLOR_VAR } from "@/game/board";
import {
  AVATARS,
  defaultSeats,
  saveMatch,
  toPlayers,
  type SeatSetup,
} from "@/game/match";
import type { Difficulty, SeatKind } from "@/game/types";
import { useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "إعداد المباراة — عبقري اللودو" },
      {
        name: "description",
        content: "اختر عدد اللاعبين، حدّد من يلعب ضد الكمبيوتر ومستوى الذكاء قبل بدء مباراة اللودو.",
      },
      { property: "og:title", content: "إعداد المباراة — عبقري اللودو" },
      {
        property: "og:description",
        content: "جهّز مقاعد اللاعبين ومستوى الكمبيوتر ثم ابدأ اللعب فورًا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

const KIND_LABEL: Record<SeatKind, string> = {
  human: "لاعب",
  ai: "كمبيوتر",
  off: "مغلق",
};

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

function SetupPage() {
  const navigate = useNavigate();
  const { profile, hydrated } = useProfile();
  const [seats, setSeats] = useState<SeatSetup[]>(() => defaultSeats("أنت"));

  useEffect(() => {
    if (hydrated) {
      setSeats((prev) =>
        prev.map((s, i) => (i === 0 && s.kind === "human" ? { ...s, name: profile.name } : s)),
      );
    }
  }, [hydrated, profile.name]);

  const active = seats.filter((s) => s.kind !== "off");
  const canStart = active.length >= 2 && active.some((s) => s.kind === "human");

  const cycleKind = (idx: number) => {
    sfx.tap();
    setSeats((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const order: SeatKind[] = ["human", "ai", "off"];
        const next = order[(order.indexOf(s.kind) + 1) % 3];
        return { ...s, kind: next };
      }),
    );
  };

  const setDiff = (idx: number, d: Difficulty) => {
    sfx.tap();
    setSeats((prev) => prev.map((s, i) => (i === idx ? { ...s, difficulty: d } : s)));
  };

  const start = () => {
    if (!canStart) return;
    sfx.tap();
    saveMatch(toPlayers(seats));
    navigate({ to: "/play" });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between">
        <Link
          to="/"
          aria-label="رجوع"
          className="grid size-10 place-items-center rounded-full border border-gold/50 bg-card text-gold"
        >
          <ArrowRight className="size-5" />
        </Link>
        <h1 className="text-2xl text-gold">إعداد المباراة</h1>
        <span className="size-10" />
      </header>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        اضغط على المقعد لتبديله بين لاعب / كمبيوتر / مغلق.
      </p>

      <section className="mt-5 flex flex-col gap-3">
        {seats.map((seat, i) => (
          <div
            key={seat.color}
            className={cn(
              "rounded-2xl border p-3 transition",
              seat.kind === "off"
                ? "border-border/40 bg-card/30 opacity-60"
                : "border-gold/40 bg-card/70",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="grid size-11 place-items-center rounded-full text-xl"
                style={{ background: COLOR_VAR[seat.color] }}
              >
                {AVATARS[seat.color]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{COLOR_LABEL[seat.color]}</p>
                {seat.kind === "human" ? (
                  <input
                    value={seat.name}
                    onChange={(e) =>
                      setSeats((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)),
                      )
                    }
                    maxLength={14}
                    className="mt-1 w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm outline-none focus:border-gold"
                    placeholder="اسم اللاعب"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {seat.kind === "ai" ? seat.name : "هذا المقعد مغلق"}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => cycleKind(i)}
                className="flex min-w-24 items-center justify-center gap-1.5 rounded-xl border border-gold/50 bg-secondary/60 px-3 py-2 text-xs font-bold active:scale-95"
              >
                {seat.kind === "human" ? (
                  <User className="size-4 text-gold" />
                ) : seat.kind === "ai" ? (
                  <Bot className="size-4 text-gold" />
                ) : (
                  <UserX className="size-4" />
                )}
                {KIND_LABEL[seat.kind]}
              </button>
            </div>

            {seat.kind === "ai" && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiff(i, d)}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-bold transition",
                      seat.difficulty === d
                        ? "bg-gold-plate text-accent-foreground"
                        : "bg-secondary/60 text-muted-foreground",
                    )}
                  >
                    {DIFF_LABEL[d]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="mt-auto flex items-center justify-center gap-3 rounded-3xl bg-velvet-plate px-6 py-5 text-2xl text-velvet-foreground shadow-[var(--shadow-plate)] ring-2 ring-gold/70 transition active:scale-[0.98] disabled:opacity-50"
      >
        <span className="font-display">ابدأ المباراة</span>
        <Play className="size-6 fill-current" />
      </button>
      {!canStart && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          تحتاج لاعبين اثنين على الأقل، وواحد منهم بشري.
        </p>
      )}
    </main>
  );
}
