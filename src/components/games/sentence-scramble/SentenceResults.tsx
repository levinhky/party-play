"use client";

import { Award, RotateCcw, Trophy } from "lucide-react";

import type { SentenceTeam } from "@/types/sentence-scramble";

interface SentenceResultsProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  hintCount: number;
  wrongAttempts: number;
  isTeamMode: boolean;
  teams: SentenceTeam[];
  onRestart: () => void;
  onBack: () => void;
}

export default function SentenceResults({
  score,
  correctCount,
  totalQuestions,
  hintCount,
  wrongAttempts,
  isTeamMode,
  teams,
  onRestart,
  onBack,
}: SentenceResultsProps) {
  const percentage =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const rankedTeams = [...teams].sort((a, b) => b.score - a.score);
  const isDraw =
    rankedTeams.length >= 2 && rankedTeams[0].score === rankedTeams[1].score;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-violet-600 px-6 py-10 text-center text-white sm:px-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <Trophy size={34} />
          </div>

          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Hoàn thành thử thách!
          </h1>

          <p className="mt-3 text-violet-100">
            Cùng xem lại kết quả của bạn nhé.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {isTeamMode && rankedTeams.length > 0 && (
            <div className="mb-8 rounded-2xl bg-violet-50 p-5 text-center">
              <Award className="mx-auto mb-3 text-violet-600" size={32} />

              <p className="text-sm font-medium text-violet-600">
                {isDraw ? "Kết quả chung cuộc" : "Đội chiến thắng"}
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                {isDraw ? "Hai đội hòa nhau!" : rankedTeams[0].name}
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {rankedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-violet-100 bg-white p-4"
                  >
                    <p className="truncate text-sm text-gray-500">
                      {team.name}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-violet-700">
                      {team.score}
                    </p>
                    <p className="text-xs text-gray-500">điểm</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-gray-500">
              {isTeamMode ? "Tổng điểm của hai đội" : "Tổng điểm của bạn"}
            </p>
            <p className="mt-2 text-5xl font-extrabold text-violet-700">
              {score}
            </p>
            <p className="mt-2 text-sm text-gray-500">điểm</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">
                {correctCount}
              </p>
              <p className="mt-1 text-xs text-emerald-700">Câu đúng</p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-violet-700">
                {percentage}%
              </p>
              <p className="mt-1 text-xs text-violet-700">Độ chính xác</p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-700">
                {hintCount}
              </p>
              <p className="mt-1 text-xs text-amber-700">Lần dùng gợi ý</p>
            </div>

            <div className="rounded-2xl bg-red-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-red-700">
                {wrongAttempts}
              </p>
              <p className="mt-1 text-xs text-red-700">Lần trả lời sai</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRestart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 font-bold text-white transition hover:bg-violet-700"
            >
              <RotateCcw size={18} />
              Chơi lại
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-xl border border-gray-200 px-5 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Về thiết lập
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}