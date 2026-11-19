import { supabase } from "@/lib/supabase";
import { ensureAnonymousSession } from "@/services/spyRoomService";
import type { TabooCardData } from "@/types/taboo";
import type {
  TabooOnlineLobby,
  TabooOnlineSession,
  TabooOnlineSlotOption,
} from "@/types/taboo-online";

export async function listTabooSlots(
  roomCode: string,
): Promise<TabooOnlineSlotOption[]> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("list_taboo_slots", {
    p_room_code: roomCode.trim().toUpperCase(),
  });
  if (error) throw error;
  return (data ?? []) as TabooOnlineSlotOption[];
}

export async function createTabooRoom(input: {
  mode: "individual" | "team";
  slotNames: string[];
  cards: TabooCardData[];
  turnDuration: number;
  rounds: number;
  deckDistribution: "shared" | "split";
}): Promise<{ room_id: string; room_code: string }> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("create_taboo_room", {
    p_mode: input.mode,
    p_slot_names: input.slotNames,
    p_cards: input.cards,
    p_turn_duration: input.turnDuration,
    p_rounds: input.rounds,
    p_deck_distribution: input.deckDistribution,
  });
  if (error) throw error;
  return data as { room_id: string; room_code: string };
}

export async function joinTabooRoom(
  roomCode: string,
  slotId: string,
  playerName: string,
): Promise<TabooOnlineSession> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("join_taboo_room", {
    p_room_code: roomCode.trim().toUpperCase(),
    p_slot_id: slotId,
    p_player_name: playerName.trim(),
  });
  if (error) throw error;
  return data as TabooOnlineSession;
}

export async function getTabooLobby(roomId: string): Promise<TabooOnlineLobby> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("get_taboo_lobby", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return data as TabooOnlineLobby;
}

export async function startTabooRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("start_taboo_room", {
    p_room_id: roomId,
  });
  if (error) throw error;
}

export async function getTabooTurnCard(
  roomId: string,
): Promise<TabooCardData | null> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("get_taboo_turn_card", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return data as TabooCardData | null;
}

export async function recordTabooAction(
  roomId: string,
  action: "correct" | "skip" | "forbidden",
): Promise<void> {
  const { error } = await supabase.rpc("record_taboo_action", {
    p_room_id: roomId,
    p_action: action,
  });
  if (error) throw error;
}

export async function advanceTabooTurn(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("advance_taboo_turn", {
    p_room_id: roomId,
  });
  if (error) throw error;
}

export async function hostFinishTabooRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("host_finish_taboo_room", {
    p_room_id: roomId,
  });
  if (error) throw error;
}
