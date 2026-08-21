import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, Volume2, VolumeX, Vibrate } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — عبقري اللودو" },
      {
        name: "description",
        content: "تحكّم باسمك، الصوت، الاهتزاز، واستعرض سجلّك أو أعد ضبط بياناتك المحفوظة محليًا.",
      },
      { property: "og:title", content: "الإعدادات — عبقري اللودو" },
      {
        property: "og:description",
        content: "الصوت، الاهتزاز، الاسم، وإعادة ضبط البيانات في عبقري اللودو.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, update, reset, hydrated } = useProfile();

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
        <h1 className="text-2xl text-gold">الإعدادات</h1>
        <span className="size-10" />
      </header>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4">
        <label className="text-sm font-bold" htmlFor="player-name">
          اسمك في اللعبة
        </label>
        <input
          id="player-name"
          value={hydrated ? profile.name : ""}
          onChange={(e) => update({ name: e.target.value })}
          maxLength={14}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 outline-none focus:border-gold"
          placeholder="أنت"
        />
      </section>

      <section className="mt-4 flex flex-col gap-3">
        <Toggle
          label="المؤثرات الصوتية"
          on={profile.sound}
          icon={profile.sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          onClick={() => {
            update({ sound: !profile.sound });
            if (!profile.sound) sfx.tap();
          }}
        />
        <Toggle
          label="الاهتزاز"
          on={profile.vibrate}
          icon={<Vibrate className="size-5" />}
          onClick={() => update({ vibrate: !profile.vibrate })}
        />
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="مباريات" value={hydrated ? profile.games : 0} />
        <Stat label="انتصارات" value={hydrated ? profile.wins : 0} />
        <Stat label="عملات" value={hydrated ? profile.coins : 0} />
      </section>

      <button
        type="button"
        onClick={() => {
          if (confirm("سيتم مسح العملات والمشتريات والسجل. متأكد؟")) reset();
        }}
        className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-destructive/60 py-4 font-bold text-destructive active:scale-[0.98]"
      >
        <RotateCcw className="size-4" />
        إعادة ضبط البيانات
      </button>
    </main>
  );
}

function Toggle({
  label,
  on,
  icon,
  onClick,
}: {
  label: string;
  on: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-4 py-3.5 active:scale-[0.99]"
    >
      <span className="flex items-center gap-2.5 font-bold">
        <span className="text-gold">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition",
          on ? "bg-gold-plate" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-background transition-all",
            on ? "right-1" : "right-6",
          )}
        />
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary/60 py-2.5">
      <p className="text-lg font-bold text-gold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
