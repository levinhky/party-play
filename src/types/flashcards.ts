export interface Flashcard {
  id: string;
  word: string;
  meaning?: string;
  imageUrl?: string;
}

export type FlashcardSource = "default" | "custom" | "combined";

export interface FlashcardsSettings {
  source: FlashcardSource;
  customCards: Flashcard[];
}
