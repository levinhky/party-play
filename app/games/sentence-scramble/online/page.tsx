import { Suspense } from "react";
import SentenceOnline from "@/components/games/sentence-scramble/SentenceOnline";

export default function SentenceScrambleOnlinePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-slate-500">Đang tải phòng...</div>}>
      <SentenceOnline />
    </Suspense>
  );
}
