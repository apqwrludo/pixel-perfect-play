import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Coins, Lock } from "lucide-react";
import { CoinPill } from "@/components/game/CoinPill";
import { SHOP_ITEMS, type ShopItem } from "@/game/shop";
import { useProfile } from "@/hooks/useProfile";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "المتجر الملكي — عبقري اللودو" },
      {
        name: "description",
        content: "اشترِ أطقم نرد ذهبية وزمرّدية، قطعًا جوهرية وإطارات ملكية بعملاتك المكتسبة.",
      },
      { property: "og:title", content: "المتجر الملكي — عبقري اللودو" },
      {
        property: "og:description",
        content: "أطقم نرد، قطع وإطارات فاخرة تُشترى بعملات اللعب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

const TABS = [
  { id: "dice", label: "النرد" },
  { id: "tokenStyle", label: "القطع" },
  { id: "frame", label: "الإطارات" },
] as const;

function ShopPage() {
  const { profile, update, hydrated } = useProfile();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("dice");
  const [toast, setToast] = useState<string | null>(null);

  const items = SHOP_ITEMS.filter((i) => i.kind === tab);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const act = (item: ShopItem) => {
    const owned = profile.owned.includes(item.id);
    const equipped = profile[item.kind] === item.id;
    if (equipped) return;
    if (owned) {
      sfx.tap();
      update({ [item.kind]: item.id } as never);
      flash(`تم تفعيل ${item.name}`);
      return;
    }
    if (profile.coins < item.price) {
      flash("عملاتك لا تكفي — العب لتكسب المزيد");
      return;
    }
    sfx.coin();
    update((p) => ({
      coins: p.coins - item.price,
      owned: [...p.owned, item.id],
      [item.kind]: item.id,
    }));
    flash(`اشتريت ${item.name}`);
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
        <h1 className="text-2xl text-gold">المتجر</h1>
        <CoinPill coins={hydrated ? profile.coins : 0} />
      </header>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              sfx.tap();
              setTab(t.id);
            }}
            className={cn(
              "rounded-xl py-2 text-sm font-bold transition",
              tab === t.id ? "bg-gold-plate text-accent-foreground" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = profile.owned.includes(item.id);
          const equipped = profile[item.kind] === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => act(item)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition active:scale-[0.98]",
                equipped ? "border-gold bg-card shadow-[0_0_24px_-8px_var(--gold)]" : "border-border/60 bg-card/60",
              )}
            >
              <span
                className="size-14 rounded-xl shadow-inner"
                style={{
                  background: `linear-gradient(145deg, ${item.colorA}, ${item.colorB})`,
                  borderRadius: item.kind === "frame" ? "9999px" : "0.9rem",
                }}
              />
              <span className="text-sm font-bold">{item.name}</span>
              <span className="text-[11px] text-muted-foreground">{item.preview}</span>
              <span
                className={cn(
                  "mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                  equipped
                    ? "bg-gold-plate text-accent-foreground"
                    : owned
                      ? "bg-secondary text-foreground"
                      : "bg-secondary/70 text-gold",
                )}
              >
                {equipped ? (
                  <>
                    <Check className="size-3.5" /> مفعّل
                  </>
                ) : owned ? (
                  "تفعيل"
                ) : (
                  <>
                    {profile.coins < item.price && <Lock className="size-3" />}
                    <Coins className="size-3.5" />
                    {item.price.toLocaleString("ar-EG")}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </section>

      {toast && (
        <div className="animate-pop-in fixed inset-x-0 bottom-8 mx-auto w-fit rounded-full border border-gold/60 bg-card px-4 py-2 text-sm text-gold shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
