"use client";

import type { TabooCardData } from "@/types/taboo";
import { Ban, Layers3, Sparkles } from "lucide-react";

interface TabooCardProps {
  card: TabooCardData;
  cardNumber: number;
  totalCards: number;
}

export default function TabooCard({
  card,
  cardNumber,
  totalCards,
}: TabooCardProps) {
  const difficultyLabel = {
    easy: "Dễ",
    medium: "Trung bình",
    hard: "Khó",
  }[card.difficulty];

  return (
    <article className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-blue-200/50">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-6 sm:px-8">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          <Layers3 size={15} className="text-blue-500" /> Thẻ từ khóa
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tabular-nums text-slate-600">
          {cardNumber} / {totalCards}
        </span>
      </div>

      <div className="px-5 pb-7 pt-3 text-center sm:px-10 sm:pb-9">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{card.category}</span>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${card.difficulty === "easy" ? "bg-emerald-50 text-emerald-700" : card.difficulty === "medium" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
            {difficultyLabel}
          </span>
        </div>

        <div className="mx-auto mt-6 max-w-2xl rounded-[1.7rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-600 px-5 py-8 text-white shadow-xl shadow-blue-200 sm:py-10">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/70"><Sparkles size={14} />Hãy diễn tả từ</p>
          <h2 className="mt-3 break-words text-4xl font-black tracking-tight sm:text-6xl">{card.word}</h2>
        </div>

        <div className="mt-5 rounded-[1.7rem] border border-rose-100 bg-rose-50/80 p-5 sm:p-6">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-rose-600"><Ban size={16} />Từ cấm</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {card.forbiddenWords.map((word) => (
              <span key={word} className="flex min-h-11 items-center justify-center rounded-xl border border-rose-100 bg-white px-2 py-2 text-sm font-bold text-rose-700 shadow-sm">{word}</span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">Không được nói từ khóa, từ cấm hoặc biến thể trực tiếp của chúng.</p>
      </div>
    </article>
  );
}
