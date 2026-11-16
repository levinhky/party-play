import type { Metadata } from "next";
import FlashcardsGame from "@/components/games/flashcards/FlashcardsGame";

export const metadata: Metadata = {
  title: "Thẻ từ vựng tiếng Anh | Party Play",
  description: "Học từ vựng bằng flashcard với bộ thẻ có sẵn hoặc thẻ tự tạo kèm ảnh URL.",
};

export default function FlashcardsPage() {
  return <FlashcardsGame />;
}
