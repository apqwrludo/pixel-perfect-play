import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameTable } from "@/components/game/GameTable";
import { defaultSeats, loadMatch, toPlayers } from "@/game/match";
import type { PlayerConfig } from "@/game/types";

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
  return <GameTable players={players} />;
}
