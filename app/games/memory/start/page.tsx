import type { Metadata } from "next";

import MemoryGame from "@/components/games/memory/MemoryGame";

export const metadata: Metadata = {
  title: "Đang chơi Memory Match | Party Play",
  description: "Lật thẻ ghi nhớ và ghép các cặp từ vựng.",
};

export default function MemoryStartPage() {
  return <MemoryGame startRoute />;
}
