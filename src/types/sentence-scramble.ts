export type SentenceDifficulty = "easy" | "medium" | "hard";

export type SentencePhase = "setup" | "playing" | "results";
export type SentencePlayStyle = "interactive" | "paper";
export type SentenceQuestionSource = "default" | "custom" | "combined";

export interface SentenceQuestion {
  id: string;
  sentence: string;
  translation: string;
  difficulty: SentenceDifficulty;
  category: string;
  hint: string;
}

export interface SentenceTeam {
  id: string;
  name: string;
  score: number;
  members: string[];
}

export interface SentenceSettings {
  mode: "individual" | "team";
  playStyle: SentencePlayStyle;
  difficulty: SentenceDifficulty;
  totalQuestions: number;
  questionSource: SentenceQuestionSource;
  customSentences: string[];
  playerNames: string[];
  teams: SentenceTeam[];
}

export interface SentenceGameState {
  phase: SentencePhase | "paper";
  settings: SentenceSettings;
  questions: SentenceQuestion[];
  currentQuestionIndex: number;
  selectedWords: string[];
  availableWords: string[];
  scores: Record<string, number>;
  currentPlayerIndex: number;
  correctCount: number;
  hintCount: number;
  wrongAttempts: number;
}
