"use client";

import type { MemoryPlayer } from "@/types/memory";
import type { ReactNode } from "react";
import { Clock3, Layers3, MoveUpRight, Target } from "lucide-react";

interface MemoryScoreboardProps {
  players: MemoryPlayer[];
  currentPlayerIndex: number;
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  elapsedSeconds: number;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function MemoryScoreboard({
  players,
  currentPlayerIndex,
  moves,
  matchedPairs,
  totalPairs,
  elapsedSeconds,
}: MemoryScoreboardProps) {
  const currentPlayer = players[currentPlayerIndex];

  return (
    <section className="space-y-4">
      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Cặp đã tìm"
          value={`${matchedPairs}/${totalPairs}`}
          icon={<Target size={17} />}
        />

        <StatCard label="Số lượt lật" value={moves} icon={<MoveUpRight size={17} />} />

        <StatCard
          label="Thời gian"
          value={formatTime(elapsedSeconds)}
          icon={<Clock3 size={17} />}
        />

        <StatCard
          label="Người chơi"
          value={currentPlayer?.name ?? "—"}
          icon={<Layers3 size={17} />}
        />
      </div>

      {/* Tiến trình */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            Tiến độ hoàn thành
          </span>

          <span className="font-bold text-violet-600">
            {totalPairs > 0
              ? Math.round((matchedPairs / totalPairs) * 100)
              : 0}
            %
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{
              width: `${
                totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Danh sách người chơi */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player, index) => {
          const isCurrentPlayer = index === currentPlayerIndex;

          return (
            <div
              key={player.id}
              className={`
                flex items-center gap-3 rounded-2xl border p-3 shadow-sm
                transition-colors
                ${
                  isCurrentPlayer
                    ? "border-violet-300 bg-white ring-2 ring-violet-100"
                    : "border-white bg-white/75"
                }
              `}
            >
              <div
                className={`
                  flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-xl text-lg
                  ${
                    isCurrentPlayer
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  }
                `}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {player.name}
                </p>

                <p className="text-xs text-slate-500">
                  {isCurrentPlayer ? "Đang chơi" : "Điểm hiện tại"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-black text-violet-600">
                  {player.score}
                </p>
                <p className="text-[10px] text-slate-400">điểm</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </span>

        <span aria-hidden="true" className="text-violet-500">{icon}</span>
      </div>

      <p className="break-words text-lg font-extrabold text-slate-900 sm:text-xl">
        {value}
      </p>
    </div>
  );
}
