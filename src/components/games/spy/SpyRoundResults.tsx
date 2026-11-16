"use client";

import { CheckCircle2, ShieldAlert, ShieldCheck, Trophy } from "lucide-react";

import type { SpyPlayer, SpyRole } from "@/types/spy";

interface SpyRoundResultsProps {
  round: number;
  winner: SpyRole;
  players: SpyPlayer[];
  guessCorrect: boolean | null;
  onNext: () => void;
}

export default function SpyRoundResults({
  round,
  winner,
  players,
  guessCorrect,
  onNext,
}: SpyRoundResultsProps) {
  const spies = players.filter((player) => player.role === "spy");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-amber-100 text-amber-600">
          <Trophy size={48} />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-600">
          Kết quả vòng {round}
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
          {winner === "civilian"
            ? "Dân thường chiến thắng!"
            : "Gián điệp chiến thắng!"}
        </h1>

        <div
          className={`mt-6 rounded-2xl border p-6 ${
            winner === "civilian"
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex justify-center">
            {winner === "civilian" ? (
              <ShieldCheck size={36} className="text-emerald-600" />
            ) : (
              <ShieldAlert size={36} className="text-rose-600" />
            )}
          </div>

          <p
            className={`mt-3 text-sm font-bold ${
              winner === "civilian" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            PHE CHIẾN THẮNG
          </p>

          <p
            className={`mt-2 text-3xl font-black ${
              winner === "civilian" ? "text-emerald-900" : "text-rose-900"
            }`}
          >
            {winner === "civilian" ? "Dân thường 🎉" : "Gián điệp 🕶️"}
          </p>
        </div>
      </div>

      {guessCorrect !== null && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <CheckCircle2
            size={22}
            className={guessCorrect ? "text-emerald-600" : "text-rose-600"}
          />

          <p className="text-sm font-medium text-slate-700">
            {guessCorrect
              ? "Gián điệp đã đoán đúng từ khóa!"
              : "Gián điệp đã đoán sai từ khóa."}
          </p>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-extrabold text-slate-900">Danh sách gián điệp</h2>

        <div className="mt-4 space-y-3">
          {spies.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-xl bg-rose-50 p-4"
            >
              <span className="font-bold text-slate-800">{player.name}</span>

              <span className="text-xs font-bold text-rose-700">GIÁN ĐIỆP</span>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onNext}
        className="mt-7 h-14 w-full rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
      >
        Quay về màn hình chính
      </button>
    </div>
  );
}
