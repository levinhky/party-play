import type { Metadata } from "next";
import ChessClock from "@/components/games/chess-clock/ChessClock";

export const metadata: Metadata = {
  title: "Đồng hồ lượt chơi | Party Play",
  description:
    "Đồng hồ chia lượt cho nhiều người chơi, tùy chỉnh số người và thời gian.",
};

export default function ChessClockPage() {
  return <ChessClock />;
}
