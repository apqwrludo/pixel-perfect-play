import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoinPill({ coins, className }: { coins: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-gold/60 bg-card/80 px-3 py-1.5 text-sm font-bold",
        className,
      )}
    >
      <Coins className="size-4 text-gold" />
      <span className="text-gold tabular-nums">{coins.toLocaleString("ar-EG")}</span>
    </div>
  );
}
