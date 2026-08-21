import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Play, Settings, ShoppingBag, Trophy } from "lucide-react";
import { CoinPill } from "@/components/game/CoinPill";
import { todayKey, useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عبقري اللودو — لعبة لودو عربية بأربعة لاعبين" },
      {
        name: "description",
        content:
          "العب لودو عربي كامل ضد الكمبيوتر أو مع أصدقائك على نفس الجهاز: نرد ثلاثي الأبعاد، دردشة وإيموجي، عملات ومتجر أطقم.",
      },
      { property: "og:title", content: "عبقري اللودو — لعبة لودو عربية" },
      {
        property: "og:description",
        content: "لودو عربي بأجواء ملكية: العب ضد الكمبيوتر أو مع أصدقائك على نفس الجهاز.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DAILY_REWARD = 300;

function Home() {
  const { profile, update, hydrated } = useProfile();
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    setClaimed(profile.lastDaily === todayKey());
  }, [profile.lastDaily]);

  const claim = () => {
    if (claimed) return;
    sfx.coin();
    update((p) => ({ coins: p.coins + DAILY_REWARD, lastDaily: todayKey() }));
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between">
        <CoinPill coins={hydrated ? profile.coins : 0} />
        <Link
          to="/settings"
          aria-label="الإعدادات"
          className="grid size-10 place-items-center rounded-full border border-gold/50 bg-card text-gold"
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <section className="mt-10 text-center">
        <div className="animate-float-soft">
          <h1 className="text-gold-plate text-6xl leading-tight">عبقري</h1>
          <h1 className="text-gold-plate -mt-3 text-7xl leading-tight">اللودو</h1>
        </div>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          لعبة اللودو المفضلة عند العرب — نرد، حواجز، أكلات، ودردشة بين اللاعبين.
        </p>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <Link
          to="/setup"
          onClick={() => sfx.tap()}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-3xl bg-velvet-plate px-6 py-5 text-2xl text-velvet-foreground shadow-[var(--shadow-plate)] ring-2 ring-gold/70 transition active:scale-[0.98]"
        >
          <span className="font-display">العب الآن</span>
          <Play className="size-6 fill-current" />
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/shop"
            onClick={() => sfx.tap()}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-gold/40 bg-card px-4 py-4 transition active:scale-[0.98]"
          >
            <ShoppingBag className="size-6 text-gold" />
            <span className="text-sm font-bold">المتجر</span>
          </Link>
          <button
            type="button"
            onClick={claim}
            disabled={claimed}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-gold/40 bg-card px-4 py-4 transition active:scale-[0.98] disabled:opacity-55"
          >
            <Gift className="size-6 text-gold" />
            <span className="text-sm font-bold">
              {claimed ? "استلمت اليوم" : `هدية يومية ${DAILY_REWARD}`}
            </span>
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-gold">
          <Trophy className="size-4" />
          <h2 className="text-base">سجلّك</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="مباريات" value={hydrated ? profile.games : 0} />
          <Stat label="انتصارات" value={hydrated ? profile.wins : 0} />
          <Stat
            label="نسبة الفوز"
            value={
              hydrated && profile.games
                ? `${Math.round((profile.wins / profile.games) * 100)}%`
                : "—"
            }
          />
        </div>
      </section>

      <p className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
        كل شيء يُحفظ على جهازك — بدون حساب ولا إنترنت.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary/60 py-2.5">
      <p className="text-lg font-bold text-gold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
