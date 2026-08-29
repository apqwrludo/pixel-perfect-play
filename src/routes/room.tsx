import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, LogIn, Loader2, Users } from "lucide-react";
import { createRoom, joinRoom } from "@/game/online";
import { useProfile } from "@/hooks/useProfile";
import { getDeviceId } from "@/lib/identity";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/room")({
  head: () => ({
    meta: [
      { title: "غرف اللعب — عبقري اللودو" },
      {
        name: "description",
        content:
          "أنشئ غرفة لودو لأربعة لاعبين أو انضم بغرفة صديقك برمز من خمسة أحرف والعبوا مباشرة عبر الإنترنت.",
      },
      { property: "og:title", content: "غرف اللعب لأربعة لاعبين — عبقري اللودو" },
      {
        property: "og:description",
        content: "أنشئ غرفة أو انضم برمز والعب لودو مع ثلاثة أصدقاء لحظيًا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const navigate = useNavigate();
  const { profile, hydrated } = useProfile();
  const [name, setName] = useState("أنت");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) setName(profile.name);
  }, [hydrated, profile.name]);

  const create = async () => {
    setError(null);
    setBusy("create");
    sfx.tap();
    try {
      const room = await createRoom(getDeviceId(), name.trim() || "لاعب");
      navigate({ to: "/room/$code", params: { code: room.code } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر إنشاء الغرفة");
      setBusy(null);
    }
  };

  const join = async () => {
    setError(null);
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("أدخل رمز الغرفة");
      return;
    }
    setBusy("join");
    sfx.tap();
    try {
      await joinRoom(c, getDeviceId(), name.trim() || "لاعب");
      navigate({ to: "/room/$code", params: { code: c } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الانضمام");
      setBusy(null);
    }
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
        <h1 className="text-2xl text-gold">اللعب مع الأصدقاء</h1>
        <span className="size-10" />
      </header>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        غرفة واحدة تتسع لأربعة لاعبين — شارك الرمز مع أصدقائك.
      </p>

      <label className="mt-6 block text-sm font-bold">اسمك في الغرفة</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={14}
        className="mt-2 w-full rounded-2xl border border-gold/40 bg-card px-4 py-3 outline-none focus:border-gold"
        placeholder="اكتب اسمك"
      />

      <button
        type="button"
        onClick={create}
        disabled={busy !== null}
        className="mt-6 flex items-center justify-center gap-3 rounded-3xl bg-velvet-plate px-6 py-5 text-xl text-velvet-foreground shadow-[var(--shadow-plate)] ring-2 ring-gold/70 transition active:scale-[0.98] disabled:opacity-60"
      >
        {busy === "create" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Users className="size-6" />
        )}
        <span className="font-display">إنشاء غرفة</span>
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        أو
        <span className="h-px flex-1 bg-border" />
      </div>

      <label className="block text-sm font-bold">رمز الغرفة</label>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={5}
        dir="ltr"
        className="mt-2 w-full rounded-2xl border border-gold/40 bg-card px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-gold"
        placeholder="ABCDE"
      />
      <button
        type="button"
        onClick={join}
        disabled={busy !== null}
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-gold/50 py-4 text-lg font-bold text-gold active:scale-[0.98] disabled:opacity-60"
      >
        {busy === "join" ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
        انضم للغرفة
      </button>

      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </main>
  );
}
