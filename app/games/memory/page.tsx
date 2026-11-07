import type { Metadata } from "next";

import MemoryGame from "@/components/games/memory/MemoryGame";

export const metadata: Metadata = {
  title: "Lật thẻ ghi nhớ | Party Play",
  description:
    "Trò chơi lật thẻ ghi nhớ cùng bạn bè, với bộ từ vựng có sẵn hoặc do bạn tự tạo.",
};

export default function MemoryPage() {
  return <MemoryGame />;
}
