export interface TabooCardData {
  id: string;
  word: string;
  forbiddenWords: string[];
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TabooTeam {
  id: string;
  name: string;
  members: string[];
  score: number;
}

export type TabooPhase = "setup" | "playing" | "results";

export interface TabooSettings {
  mode: "individual" | "teams";
  teams: TabooTeam[];
  turnDuration: number;
  rounds: number;
  cards: TabooCardData[];
}

export interface TabooGameState {
  phase: TabooPhase;
  teams: TabooTeam[];
  cards: TabooCardData[];
  currentTeamIndex: number;
  currentRound: number;
  currentCardIndex: number;
  turnDuration: number;
  timeLeft: number;
  correctCount: number;
  skippedCount: number;
  forbiddenCount: number;
  settings: TabooSettings;
}
