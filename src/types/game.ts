export type GameCategory = "party" | "english";

export interface Game {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  icon: string;
  color: string;
  background: string;
  players: string;
  duration: string;
  badge?: string;
  href: string;
}
