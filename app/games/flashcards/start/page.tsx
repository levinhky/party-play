import type { Metadata } from "next";
import FlashcardsGame from "@/components/games/flashcards/FlashcardsGame";

export const metadata: Metadata = {
  title: "Đang học thẻ từ vựng | Party Play",
  description: "Lật thẻ từ vựng và ôn tập theo nhịp của bạn.",
};

export default function FlashcardsStartPage() {
  return <FlashcardsGame startRoute />;
}
