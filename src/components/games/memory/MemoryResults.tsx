"use client";

import type { MemoryPlayer } from "@/types/memory";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MemoryResultsProps {
  players: MemoryPlayer[];
  moves: number;
  elapsedSeconds: number;
  totalPairs: number;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function MemoryResults({
  players,
  moves,
  elapsedSeconds,
  totalPairs,
  onPlayAgain,
  onBackToSetup,
}: MemoryResultsProps) {
  const sortedPlayers = [...players].sort(
    (a, b) => b.score - a.score,
  );

  const highestScore = sortedPlayers[0]?.score ?? 0;

  const winners = sortedPlayers.filter(
    (player) => player.score === highestScore,
  );

  const isTie = winners.length > 1;

  return (
    <div className="min-h-screen bg-[#f3f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
      <Link href="/games" className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-blue-200 hover:text-blue-700"><ArrowLeft size={17} />Quay lại trò chơi</Link>
      {/* Kết quả nổi bật */}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100/60">
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-600 px-6 py-10 text-center text-white sm:px-10">
          <div className="text-5xl">🏆</div>

          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
            Hoàn thành trò chơi
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {isTie ? "Một trận hòa!" : "Chúc mừng chiến thắng!"}
          </h1>

          <p className="mt-3 text-blue-100">
            {isTie
              ? `Những người chơi đồng hạng nhất: ${winners
                  .map((player) => player.name)
                  .join(", ")}`
              : `${winners[0]?.name ?? "Người chơi"} là người chiến thắng!`}
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2">
            <span>⭐</span>

            <span className="font-bold">
              {highestScore} điểm
            </span>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <SummaryStat
            label="Cặp đã ghép"
            value={`${totalPairs}`}
            suffix="cặp"
          />

          <SummaryStat
            label="Số lượt lật"
            value={`${moves}`}
            suffix="lượt"
          />

          <SummaryStat
            label="Thời gian"
            value={formatTime(elapsedSeconds)}
            suffix="phút:giây"
          />
        </div>

        {/* Bảng xếp hạng */}
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Bảng xếp hạng
          </h2>

          <div className="mt-5 space-y-3">
            {sortedPlayers.map((player, index) => {
              const isWinner = player.score === highestScore;

              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center gap-3 rounded-2xl border p-4
                    ${
                      isWinner
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-100 bg-slate-50"
                    }
                  `}
                >
                  <div
                    className={`
                      flex h-10 w-10 shrink-0 items-center justify-center
                      rounded-xl text-lg font-black
                      ${
                        index === 0
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-slate-500"
                      }
                    `}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">
                      {player.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {isWinner ? "Người chiến thắng" : "Đã hoàn thành"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-blue-600">
                      {player.score}
                    </p>

                    <p className="text-xs text-slate-400">điểm</p>
                  </div>
                </div>
              );
            })}
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
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="px-2 py-5 text-center sm:px-4">
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>

      <p className="mt-2 break-words text-xl font-black text-slate-900 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
        {suffix}
      </p>
    </div>
  );
}
