export interface SpyRoom {
  id: string;
  room_code: string;
  host_id: string;
  status: "waiting" | "playing" | "finished";
  current_phase:
    | "lobby"
    | "pass-device"
    | "reveal"
    | "discussion"
    | "voting"
    | "vote-results"
    | "elimination"
    | "guess-word"
    | "game-results";
  current_round: number;
  settings: Record<string, unknown>;
  discussion_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpyRoomPlayer {
  id: string;
  room_id: string;
  player_name: string;
  is_host: boolean;
  is_ready: boolean;
  is_eliminated: boolean;
  has_voted: boolean;
  joined_at: string;
}

export interface SpyRoomSession {
  room_id: string;
  room_code: string;
  player_id: string;
  is_host: boolean;
}

export interface SpyRoomRole {
  id: string;
  room_id: string;
  player_id: string;
  role: "civilian" | "spy";
  secret_word: string | null;
}

export interface SpyRoomVote {
  id: string;
  room_id: string;
  round_number: number;
  voter_id: string;
  target_id: string;
}
