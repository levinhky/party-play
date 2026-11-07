import type { Metadata } from "next";

import SentenceGame from "@/components/games/sentence-scramble/SentenceGame";

export const metadata: Metadata = {
  title: "Đang chơi Sắp xếp câu | Party Play",
  description: "Chơi Sentence Scramble theo cách tương tác hoặc viết câu ra giấy.",
};

export default function SentenceScrambleStartPage() {
  return <SentenceGame startRoute />;
}
