import type { Metadata } from "next";

import SentenceGame from "@/components/games/sentence-scramble/SentenceGame";

export const metadata: Metadata = {
  title: "Sắp xếp câu | Party Play",
  description:
    "Luyện tiếng Anh với trò chơi sắp xếp từ thành câu. Chơi cá nhân hoặc thi đua cùng bạn bè.",
};

export default function SentenceScramblePage() {
  return <SentenceGame />;
}