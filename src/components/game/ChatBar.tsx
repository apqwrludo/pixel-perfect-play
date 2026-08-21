import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PHRASES = [
  "يا سلام!",
  "حظ موفق 🍀",
  "شوف الضربة 😎",
  "ياخي بس!",
  "دورك يا بطل",
  "أكلتك 😂",
  "لعبة حلوة",
  "بسرعة الله يهديك",
];

const EMOJIS = ["😂", "😎", "🔥", "😭", "👏", "🤯", "💪", "🌟"];

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatBar({ onSend, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="الدردشة والإيموجي"
        className="grid size-11 place-items-center rounded-full border border-gold/50 bg-card text-gold transition active:scale-95"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {open && (
        <div className="animate-pop-in absolute bottom-14 left-0 z-30 w-64 rounded-2xl border border-gold/40 bg-popover p-3 shadow-[var(--shadow-plate)]">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSend(e);
                  setOpen(false);
                }}
                className="grid size-9 place-items-center rounded-xl bg-secondary text-lg transition active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {PHRASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onSend(p);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-right text-xs font-medium transition",
                  "bg-secondary/60 hover:bg-secondary active:scale-[0.98]",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
