import { create } from "zustand";
import { HP_MAX, MAG, MATCH_SECONDS, type Team } from "./world";

export type FpsPhase = "menu" | "playing" | "over";
export type FpsMode = "solo" | "online";

export interface FeedItem {
  id: number;
  text: string;
  mine: boolean;
}

interface FpsStore {
  phase: FpsPhase;
  mode: FpsMode;
  room: string;
  myName: string;
  myTeam: Team;
  health: number;
  ammo: number;
  reloading: boolean;
  kills: number;
  deaths: number;
  scoreRed: number;
  scoreBlue: number;
  timeLeft: number;
  feed: FeedItem[];
  hitmarkAt: number;
  winner: Team | null;

  set: (p: Partial<FpsStore>) => void;
  startMatch: (p: { mode: FpsMode; room: string; name: string; team: Team }) => void;
  endMatch: (winner: Team) => void;
  addFeed: (text: string, mine: boolean) => void;
}

let feedSeq = 0;

export const useFps = create<FpsStore>((set) => ({
  phase: "menu",
  mode: "solo",
  room: "",
  myName: "أنت",
  myTeam: "red",
  health: HP_MAX,
  ammo: MAG,
  reloading: false,
  kills: 0,
  deaths: 0,
  scoreRed: 0,
  scoreBlue: 0,
  timeLeft: MATCH_SECONDS,
  feed: [],
  hitmarkAt: 0,
  winner: null,

  set: (p) => set(p),
  startMatch: ({ mode, room, name, team }) =>
    set({
      phase: "playing",
      mode,
      room,
      myName: name,
      myTeam: team,
      health: HP_MAX,
      ammo: MAG,
      reloading: false,
      kills: 0,
      deaths: 0,
      scoreRed: 0,
      scoreBlue: 0,
      timeLeft: MATCH_SECONDS,
      feed: [],
      winner: null,
    }),
  endMatch: (winner) => set({ phase: "over", winner }),
  addFeed: (text, mine) =>
    set((s) => ({
      feed: [...s.feed.slice(-4), { id: ++feedSeq, text, mine }],
    })),
}));
