export type MemoryDifficulty = "easy" | "medium" | "hard";

export type MemoryMode = "icons" | "vocabulary";
export type MemoryVocabularySource = "default" | "custom" | "combined";

export type MemoryPhase = "setup" | "playing" | "results";

export interface MemoryPlayer {
  id: string;
  name: string;
  score: number;
}

export interface MemoryCardData {
  id: string;
  pairId: string;
  content: string;
  matchContent?: string;
  type: "icon" | "vocabulary";
}

export interface MemoryCardState extends MemoryCardData {
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemorySettings {
  playerNames: string[];
  difficulty: MemoryDifficulty;
  mode: MemoryMode;
  vocabularySource: MemoryVocabularySource;
  customVocabulary: MemoryCardData[];
}

export interface MemoryGameState {
  phase: MemoryPhase;
  players: MemoryPlayer[];
  cards: MemoryCardState[];
  currentPlayerIndex: number;
  moves: number;
  matchedPairs: number;
  startedAt: number | null;
  elapsedSeconds: number;
  settings: MemorySettings;
}
