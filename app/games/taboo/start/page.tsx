import type { Metadata } from "next";

import TabooGame from "@/components/games/taboo/TabooGame";

export const metadata: Metadata = {
  title: "Đang chơi Taboo | Party Play",
  description: "Cùng mô tả từ khóa và ghi điểm trong trò chơi Taboo.",
};

export default function TabooStartPage() {
  return <TabooGame startRoute />;
}
