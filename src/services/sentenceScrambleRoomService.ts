import { supabase } from "@/lib/supabase";
import { ensureAnonymousSession } from "@/services/spyRoomService";
import type {
  SentenceScrambleAssignment,
  SentenceScrambleOnlineMode,
  SentenceScrambleRoomLobby,
  SentenceScrambleRoomSession,
  SentenceScrambleRoomTargetOption,
  SentenceScrambleTargetDraft,
} from "@/types/sentence-scramble-online";

export async function createSentenceScrambleRoom(
  mode: SentenceScrambleOnlineMode,
  targets: SentenceScrambleTargetDraft[],
  durationMinutes: number,
): Promise<{ room_id: string; room_code: string }> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("create_sentence_scramble_room", {
    p_mode: mode,
    p_targets: targets,
    p_duration_minutes: durationMinutes,
  });
  if (error) throw error;
  return data as { room_id: string; room_code: string };
}

export async function listSentenceScrambleTargets(
  roomCode: string,
): Promise<SentenceScrambleRoomTargetOption[]> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("list_sentence_scramble_targets", {
    p_room_code: roomCode.trim().toUpperCase(),
  });
  if (error) throw error;
  return (data ?? []) as SentenceScrambleRoomTargetOption[];
}

export async function joinSentenceScrambleRoom(
  roomCode: string,
  slotId: string,
  playerName: string,
): Promise<SentenceScrambleRoomSession> {
  await ensureAnonymousSession();
  const { data, error } = await supabase.rpc("join_sentence_scramble_room", {
    p_room_code: roomCode.trim().toUpperCase(),
    p_slot_id: slotId,
    p_player_name: playerName.trim(),
  });
  if (error) throw error;
  return data as SentenceScrambleRoomSession;
}

export async function getSentenceScrambleLobby(
  roomId: string,
): Promise<SentenceScrambleRoomLobby> {
  const { data, error } = await supabase.rpc("get_sentence_scramble_lobby", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return data as SentenceScrambleRoomLobby;
}

export async function startSentenceScrambleRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("start_sentence_scramble_room", {
    p_room_id: roomId,
  });
  if (error) throw error;
}

export async function markSentenceScrambleAnswersViewed(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_sentence_scramble_answers_viewed", {
    p_room_id: roomId,
  });
  if (error) throw error;
}

export async function finishSentenceScrambleTarget(roomId: string): Promise<{ status: "playing" | "finished" }> {
  const { data, error } = await supabase.rpc("finish_sentence_scramble_target", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return data as { status: "playing" | "finished" };
}

export async function hostFinishSentenceScrambleRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc("host_finish_sentence_scramble_room", {
    p_room_id: roomId,
  });
  if (error) throw error;
}

export async function getMySentenceScrambleAssignments(
  roomId: string,
  slotIds: string[],
): Promise<SentenceScrambleAssignment[]> {
  await ensureAnonymousSession();
  if (slotIds.length === 0) return [];
  const { data, error } = await supabase
    .from("sentence_scramble_room_assignments")
    .select("slot_id, sentences")
    .eq("room_id", roomId)
    .in("slot_id", slotIds);
  if (error) throw error;
  return (data ?? []) as SentenceScrambleAssignment[];
}
