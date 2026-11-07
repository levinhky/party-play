export type SpyRole = "civilian" | "spy";

export type SpyPhase =
  | "setup"
  | "pass-device"
  | "reveal"
  | "discussion"
  | "voting"
  | "vote-results"
  | "elimination"
  | "guess-word"
  | "game-results";

export type SpyMode = "different-word" | "no-word";

export type SpyWordSource = "default" | "custom" | "all";

export interface SpyWordPair {
  id: string;
  category: string;
  word: string;
  spyWord: string;
}

export interface SpyPlayer {
  id: string;
  name: string;
  role: SpyRole;
  word: string | null;
  isEliminated: boolean;
  votesReceived?: number;
  wins?: number;
}

export interface SpySettings {
  playerNames: string[];
  spyCount: number;
  mode: SpyMode;
  category: string;
  discussionMinutes: number;

  wordSource?: SpyWordSource;
  customWordPairs?: SpyWordPair[];
}

export interface SpyVote {
  voterId: string;
  targetId: string;
}

export interface SpyVoteRound {
  attempt: number;
  votes: SpyVote[];
  tiedPlayerIds: string[];
  eliminatedPlayerId: string | null;
}

export interface SpyRoundResult {
  round: number;
  winner: SpyRole;
  eliminatedPlayerId: string | null;
  guessCorrect?: boolean;
  wordPair: SpyWordPair;
  players: SpyPlayer[];
}

export interface SpyGameState {
  phase: SpyPhase;
  players: SpyPlayer[];
  currentPlayerIndex: number;
  currentRound: number;
  wordPair: SpyWordPair | null;
  settings: SpySettings;
  winner: SpyRole | null;
  votes: SpyVote[];
  voteHistory: SpyVoteRound[];
  eliminatedPlayerId: string | null;
  tiedPlayerIds: string[];
  guessPlayerId: string | null;
  roundResults: SpyRoundResult[];
  scores: Record<string, number>;
  guessCorrect: boolean | null;
  discussionSession: number;
  votingAttempt: number;
}
