import { useCallback, useEffect, useState } from "react";
import { setSoundEnabled } from "@/lib/sound";

export interface Profile {
  name: string;
  coins: number;
  owned: string[];
  dice: string;
  tokenStyle: string;
  frame: string;
  sound: boolean;
  vibrate: boolean;
  lastDaily: string | null;
  wins: number;
  games: number;
}

const KEY = "ludo-genius-profile-v1";

export const DEFAULT_PROFILE: Profile = {
  name: "أنت",
  coins: 2500,
  owned: ["dice-classic", "token-classic", "frame-none"],
  dice: "dice-classic",
  tokenStyle: "token-classic",
  frame: "frame-none",
  sound: true,
  vibrate: true,
  lastDaily: null,
  wins: 0,
  games: 0,
};

function read(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = read();
    setProfile(p);
    setSoundEnabled(p.sound);
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) => {
    setProfile((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      setSoundEnabled(next.sound);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    setProfile(DEFAULT_PROFILE);
  }, []);

  return { profile, update, reset, hydrated };
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
