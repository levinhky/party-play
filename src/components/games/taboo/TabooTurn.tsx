"use client";

import { Check, CircleAlert, SkipForward, Timer } from "lucide-react";

import TabooCard from "@/components/games/taboo/TabooCard";
import type { TabooCardData, TabooTeam } from "@/types/taboo";

interface TabooTurnProps {
  card: TabooCardData;
  team: TabooTeam;
  cardNumber: number;
  totalCards: number;
  turnDuration: number;
  timeLeft: number;
  onCorrect: () => void;
  onSkip: () => void;
  onForbidden: () => void;
}

export default function TabooTurn({
  card,
  team,
  cardNumber,
  totalCards,
  turnDuration,
  timeLeft,
  onCorrect,
  onSkip,
  onForbidden,
}: TabooTurnProps) {
  const percentage = (timeLeft / turnDuration) * 100;
  const formattedTime = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
  const urgent = timeLeft <= 10;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white bg-white/85 p-4 shadow-sm backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-500 text-white shadow-lg shadow-blue-200">
            <span className="text-lg font-black">
              {team.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Đang đến lượt
            </p>
            <p className="mt-0.5 max-w-[55vw] truncate text-lg font-black text-slate-900">
              {team.name}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 ${urgent ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-700"}`}
        >
          <Timer size={18} />
          <span className="font-mono text-2xl font-black tabular-nums">
            {formattedTime}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ${urgent ? "bg-rose-500" : "bg-linear-to-r from-blue-500 to-blue-500"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <TabooCard card={card} cardNumber={cardNumber} totalCards={totalCards} />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onCorrect}
          className="rounded-2xl bg-emerald-600 px-4 py-4 font-bold text-white shadow-lg shadow-emerald-200/60 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Check size={18} /> Đoán đúng
          </span>
          <span className="mt-1 block text-xs font-medium text-emerald-100">
            +1 điểm
          </span>
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <SkipForward size={18} /> Bỏ qua
          </span>
          <span className="mt-1 block text-xs font-medium text-slate-400">
            Không cộng điểm
          </span>
        </button>

        <button
          type="button"
          onClick={onForbidden}
          className="col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-bold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100 active:scale-[0.98] sm:col-span-1"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <CircleAlert size={18} /> Phạm luật
          </span>
          <span className="mt-1 block text-xs font-medium text-red-400">
            Trừ 1 điểm
          </span>
        </button>
      </div>
    </section>
  );
}
