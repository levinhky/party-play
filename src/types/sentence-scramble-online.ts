export type SentenceScrambleOnlineMode = "individual" | "team";
export type SentenceScrambleOnlineStatus = "waiting" | "playing" | "finished";

export interface SentenceScrambleTargetDraft {
  name: string;
  sentences: string[];
}

export interface SentenceScrambleRoomTarget {
  id: string;
  name: string;
  slot_type: SentenceScrambleOnlineMode;
  position: number;
  player_count: number;
  answer_viewed: boolean;
  finished: boolean;
}

export interface SentenceScrambleRoomPlayer {
  id: string;
  slot_id: string;
  display_name: string;
  target_name: string;
}

export interface SentenceScrambleRoomLobby {
  id: string;
  room_code: string;
  host_id: string;
  is_host: boolean;
  mode: SentenceScrambleOnlineMode;
  status: SentenceScrambleOnlineStatus;
  time_limit_minutes: number;
  created_at: string;
  started_at: string | null;
  targets: SentenceScrambleRoomTarget[];
  players: SentenceScrambleRoomPlayer[];
  my_players: SentenceScrambleRoomPlayer[];
}

export interface SentenceScrambleRoomTargetOption {
  room_id: string;
  mode: SentenceScrambleOnlineMode;
  room_status: SentenceScrambleOnlineStatus;
  slot_id: string;
  slot_name: string;
  slot_type: SentenceScrambleOnlineMode;
}

export interface SentenceScrambleRoomSession {
  room_id: string;
  room_code: string;
  player_id: string;
  slot_id: string;
}

export interface SentenceScrambleAssignment {
  slot_id: string;
  sentences: string[];
}
