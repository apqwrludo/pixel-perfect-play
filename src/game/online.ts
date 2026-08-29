import { supabase } from "@/integrations/supabase/client";
import { AVATARS, SEAT_ORDER, AI_NAMES } from "@/game/match";
import type { ColorId, GameState, PlayerConfig } from "@/game/types";

export interface RoomSeat {
  color: ColorId;
  /** معرّف اللاعب الذي يشغل المقعد، أو null إذا كان فارغًا */
  playerId: string | null;
  name: string;
  filled: boolean;
  /** يُملأ بالكمبيوتر عند بدء المباراة إذا بقي فارغًا */
  ai: boolean;
}

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "over";
  seats: RoomSeat[];
  state: GameState | null;
  rev: number;
}

const TABLE = "ludo_rooms";

export function emptySeats(): RoomSeat[] {
  return SEAT_ORDER.map((color) => ({
    color,
    playerId: null,
    name: "",
    filled: false,
    ai: false,
  }));
}

export function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function normalize(row: Record<string, unknown>): RoomRow {
  return {
    id: row.id as string,
    code: row.code as string,
    host_id: row.host_id as string,
    status: row.status as RoomRow["status"],
    seats: (row.seats as RoomSeat[]) ?? emptySeats(),
    state: (row.state as GameState | null) ?? null,
    rev: (row.rev as number) ?? 0,
  };
}

export async function createRoom(playerId: string, name: string): Promise<RoomRow> {
  const seats = emptySeats();
  seats[0] = { color: "red", playerId, name, filled: true, ai: false };
  const code = makeCode();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ code, host_id: playerId, status: "lobby", seats, rev: 0 })
    .select()
    .single();
  if (error) throw error;
  return normalize(data as Record<string, unknown>);
}

export async function fetchRoom(code: string): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Record<string, unknown>) : null;
}

export async function joinRoom(code: string, playerId: string, name: string): Promise<RoomRow> {
  const room = await fetchRoom(code);
  if (!room) throw new Error("لا توجد غرفة بهذا الرمز");
  if (room.status !== "lobby" && !room.seats.some((s) => s.playerId === playerId))
    throw new Error("المباراة بدأت بالفعل");

  if (room.seats.some((s) => s.playerId === playerId)) return room;

  const idx = room.seats.findIndex((s) => !s.filled);
  if (idx === -1) throw new Error("الغرفة ممتلئة (٤ لاعبين)");

  const seats = room.seats.map((s, i) =>
    i === idx ? { ...s, playerId, name, filled: true, ai: false } : s,
  );
  const { data, error } = await supabase
    .from(TABLE)
    .update({ seats })
    .eq("id", room.id)
    .select()
    .single();
  if (error) throw error;
  return normalize(data as Record<string, unknown>);
}

export async function leaveRoom(roomId: string, seats: RoomSeat[], playerId: string) {
  const next = seats.map((s) =>
    s.playerId === playerId ? { ...s, playerId: null, name: "", filled: false, ai: false } : s,
  );
  await supabase.from(TABLE).update({ seats: next }).eq("id", roomId);
}

export function seatsToPlayers(seats: RoomSeat[], fillWithAi: boolean): PlayerConfig[] {
  return seats
    .filter((s) => s.filled || fillWithAi)
    .map((s) => ({
      color: s.color,
      name: s.filled ? s.name || "لاعب" : AI_NAMES[s.color],
      kind: s.filled ? ("human" as const) : ("ai" as const),
      difficulty: "medium" as const,
      avatar: AVATARS[s.color],
    }));
}

export async function startRoom(roomId: string, seats: RoomSeat[], state: GameState, rev: number) {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: "playing", seats, state, rev })
    .eq("id", roomId);
  if (error) throw error;
}

export async function pushState(roomId: string, state: GameState, rev: number) {
  const { error } = await supabase
    .from(TABLE)
    .update({ state, rev, status: state.phase === "over" ? "over" : "playing" })
    .eq("id", roomId);
  if (error) console.error(error);
}

export function subscribeRoom(code: string, onChange: (room: RoomRow) => void) {
  const channel = supabase
    .channel(`ludo-room-${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `code=eq.${code}` },
      (payload) => {
        if (payload.new) onChange(normalize(payload.new as Record<string, unknown>));
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
