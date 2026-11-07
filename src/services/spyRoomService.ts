import { supabase } from "@/lib/supabase";
import type {
  SpyRoom,
  SpyRoomPlayer,
  SpyRoomRole,
  SpyRoomSession,
  SpyRoomVote,
} from "@/types/spy-online";

let authPromise: Promise<string> | null = null;

/**
 * Ensure the current browser has an anonymous Supabase session.
 *
 * Concurrent calls share the same promise to avoid creating
 * multiple anonymous users at the same time.
 */
export async function ensureAnonymousSession(): Promise<string> {
  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (session?.user) {
      return session.user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Không thể tạo tài khoản người chơi.");
    }

    return data.user.id;
  })();

  try {
    return await authPromise;
  } finally {
    authPromise = null;
  }
}

/**
 * Create a new Spy room.
 */
export async function createSpyRoom(
  playerName: string,
): Promise<SpyRoomSession> {
  await ensureAnonymousSession();

  const { data, error } = await supabase.rpc("create_spy_room", {
    p_player_name: playerName.trim(),
  });

  if (error) {
    throw error;
  }

  return data as SpyRoomSession;
}

/**
 * Join an existing Spy room.
 */
export async function joinSpyRoom(
  roomCode: string,
  playerName: string,
): Promise<SpyRoomSession> {
  await ensureAnonymousSession();

  const { data, error } = await supabase.rpc("join_spy_room", {
    p_room_code: roomCode.trim().toUpperCase(),
    p_player_name: playerName.trim(),
  });

  if (error) {
    throw error;
  }

  return data as SpyRoomSession;
}

/**
 * Fetch room information.
 *
 * RLS ensures that only room members can read this data.
 */
export async function getSpyRoom(roomId: string) {
  const { data, error } = await supabase
    .from("spy_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) {
    throw error;
  }

  return data as SpyRoom;
}

/** Start a waiting room. The database policy must restrict this update to its host. */
export async function startSpyRoom(
  roomId: string,
  playerId: string,
  settings: Record<string, unknown>,
  wordPair: { category: string; word: string; spyWord: string },
): Promise<SpyRoom> {
  const { data, error } = await supabase.rpc("start_spy_room", {
    p_room_id: roomId,
    p_player_id: playerId,
    p_settings: settings,
    p_word_pair: wordPair,
  });

  if (error) throw error;

  // PostgreSQL composite returns can be represented as either a row or a
  // single-row array depending on the Supabase function definition.
  const room = Array.isArray(data) ? data[0] : data;
  if (!room) throw new Error("ROOM_START_FAILED");
  return room as SpyRoom;
}

/** Read only this user's secret role; RLS prevents access to other players' roles. */
export async function getMySpyRoomRole(
  roomId: string,
  playerId: string,
): Promise<SpyRoomRole | null> {
  const { data, error } = await supabase
    .from("spy_player_roles")
    .select("id, room_id, player_id, role, secret_word")
    .eq("room_id", roomId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) throw error;
  return (data as SpyRoomRole | null) ?? null;
}

export async function setSpyPlayerReady(
  roomId: string,
  playerId: string,
  isReady: boolean,
): Promise<SpyRoomPlayer> {
  const { data, error } = await supabase
    .from("spy_room_players")
    .update({ is_ready: isReady })
    .eq("room_id", roomId)
    .eq("id", playerId)
    .select("*")
    .single();

  if (error) throw error;
  return data as SpyRoomPlayer;
}

export async function startSpyDiscussion(
  roomId: string,
  playerId: string,
): Promise<SpyRoom> {
  const { data, error } = await supabase.rpc("start_spy_discussion", {
    p_room_id: roomId,
    p_player_id: playerId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as SpyRoom;
}

export async function advanceSpyDiscussion(
  roomId: string,
  playerId: string,
): Promise<SpyRoom> {
  const { data, error } = await supabase.rpc("advance_spy_discussion", {
    p_room_id: roomId,
    p_player_id: playerId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as SpyRoom;
}

export async function getMySpyRoomVote(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<SpyRoomVote | null> {
  const { data, error } = await supabase
    .from("spy_votes")
    .select("id, room_id, round_number, voter_id, target_id")
    .eq("room_id", roomId)
    .eq("round_number", roundNumber)
    .eq("voter_id", playerId)
    .maybeSingle();
  if (error) throw error;
  return (data as SpyRoomVote | null) ?? null;
}

export async function castSpyRoomVote(
  roomId: string,
  voterId: string,
  targetId: string,
): Promise<SpyRoomVote> {
  const { data, error } = await supabase.rpc("cast_spy_room_vote", {
    p_room_id: roomId,
    p_voter_id: voterId,
    p_target_id: targetId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as SpyRoomVote;
}

export async function getSpyRoomVotes(
  roomId: string,
  roundNumber: number,
): Promise<SpyRoomVote[]> {
  const { data, error } = await supabase
    .from("spy_votes")
    .select("id, room_id, round_number, voter_id, target_id")
    .eq("room_id", roomId)
    .eq("round_number", roundNumber)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpyRoomVote[];
}

export async function completeSpyVoting(roomId: string): Promise<SpyRoom> {
  const { data, error } = await supabase
    .from("spy_rooms")
    .update({ current_phase: "vote-results" })
    .eq("id", roomId)
    .eq("status", "playing")
    .eq("current_phase", "voting")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (data) return data as SpyRoom;

  const currentRoom = await getSpyRoom(roomId);
  if (currentRoom.current_phase === "vote-results") return currentRoom;
  throw new Error("VOTING_NOT_COMPLETE");
}

export async function replaySpyRoom(
  roomId: string,
  hostPlayerId: string,
): Promise<SpyRoom> {
  const { data, error } = await supabase.rpc("replay_spy_room", {
    p_room_id: roomId,
    p_player_id: hostPlayerId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as SpyRoom;
}

/**
 * Fetch room players.
 */
export async function getSpyRoomPlayers(
  roomId: string,
): Promise<SpyRoomPlayer[]> {
  const { data, error } = await supabase
    .from("spy_room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SpyRoomPlayer[];
}

/**
 * Subscribe to room changes.
 */
export function subscribeSpyRoom(
  roomId: string,
  onChange: (room: SpyRoom) => void,
) {
  const channel = supabase
    .channel(`spy-room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "spy_rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          onChange(payload.new as SpyRoom);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to player list changes.
 */
export function subscribeSpyRoomPlayers(
  roomId: string,
  onChange: (players: SpyRoomPlayer[]) => void,
) {
  const channel = supabase
    .channel(`spy-room-players-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "spy_room_players",
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        try {
          const players = await getSpyRoomPlayers(roomId);
          onChange(players);
        } catch (error) {
          console.error("Failed to refresh room players:", error);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
