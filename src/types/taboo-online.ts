import type { TabooCardData } from "@/types/taboo";

export type TabooOnlineStatus = "waiting" | "playing" | "finished";

export interface TabooOnlineSlotOption {
  room_id: string;
  mode: "individual" | "team";
  room_status: TabooOnlineStatus;
  slot_id: string;
  slot_name: string;
  slot_type: "individual" | "team";
}

export interface TabooOnlineSlot {
  id: string;
  name: string;
  position: number;
  slot_type: "individual" | "team";
  score: number;
  player_count: number;
}

export interface TabooOnlinePlayer {
  id: string;
  slot_id: string;
  display_name: string;
  is_host: boolean;
}

export interface TabooOnlineLobby {
  id: string;
  room_code: string;
  host_id: string;
  is_host: boolean;
  mode: "individual" | "team";
  status: TabooOnlineStatus;
  deck_distribution: "shared" | "split";
  turn_duration: number;
  rounds: number;
  current_round: number;
  current_slot_id: string | null;
  turn_started_at: string | null;
  correct_count: number;
  skipped_count: number;
  forbidden_count: number;
  created_at: string;
  started_at: string | null;
  slots: TabooOnlineSlot[];
  players: TabooOnlinePlayer[];
  my_slots: string[];
}

export interface TabooOnlineSession {
  room_id: string;
  room_code: string;
  player_id: string;
  slot_id: string;
}

export interface TabooCardOption {
  card: TabooCardData;
}
