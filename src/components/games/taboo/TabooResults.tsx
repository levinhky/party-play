"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TabooTeam } from "@/types/taboo";

interface TabooResultsProps {
  mode: "individual" | "teams";
  teams: TabooTeam[];
  rounds: number;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

export default function TabooResults({
  mode,
  teams,
  rounds,
  onPlayAgain,
  onBackToSetup,
}: TabooResultsProps) {
  const ranking = [...teams].sort((a, b) => b.score - a.score);

  const highestScore = ranking[0]?.score ?? 0;

  const winners = ranking.filter(
    (team) => team.score === highestScore,
  );

  const isTie = winners.length > 1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-100/50">
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-600 px-6 py-10 text-center text-white sm:px-10">
          <div className="text-6xl">🏆</div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
            Kết thúc trò chơi
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            {isTie ? "Đồng điểm!" : "Chúc mừng chiến thắng!"}
          </h1>

          <p className="mt-3 leading-6 text-blue-100">
            {isTie
              ? `${mode === "individual" ? "Người chơi" : "Các đội"} đồng hạng nhất: ${winners
                  .map((team) => team.name)
                  .join(", ")}`
              : `${winners[0]?.name ?? (mode === "individual" ? "Người chơi" : "Đội chơi")} đã giành chiến thắng!`}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2">
            <span>⭐</span>

            <span className="font-bold">{highestScore} điểm</span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <Link href="/games" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700">
            <ArrowLeft size={17} /> Quay lại
          </Link>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "individual" ? "Xếp hạng cá nhân" : "Bảng xếp hạng đội"}
            </h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {rounds} vòng
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {ranking.map((team, index) => (
              <div
                key={team.id}
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  team.score === highestScore
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                  {index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">
                    {team.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {team.score === highestScore
                      ? mode === "individual" ? "Người chiến thắng" : "Đội chiến thắng"
                      : "Đã hoàn thành"}
                  </p>
                </div>

                <p className="text-2xl font-black text-blue-600">
                  {team.score}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded-2xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
            >
              Chơi lại
            </button>

            <button
              type="button"
              onClick={onBackToSetup}
              className="rounded-2xl border border-slate-200 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại thiết lập
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
