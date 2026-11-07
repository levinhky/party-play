import type { Metadata } from "next";

import TabooGame from "@/components/games/taboo/TabooGame";

export const metadata: Metadata = {
  title: "Thử thách Taboo | Party Play",
  description:
    "Trò chơi đoán từ tiếng Anh cá nhân hoặc theo đội. Hãy diễn tả từ khóa mà không sử dụng những từ cấm.",
};

export default function TabooPage() {
  return <TabooGame />;
}
