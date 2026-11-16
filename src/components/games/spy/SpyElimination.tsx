"use client";

import { Skull, Users, ArrowRight } from "lucide-react";

import type { SpyPlayer } from "@/types/spy";

interface SpyEliminationProps {
  player: SpyPlayer;
  remainingPlayers: number;
  onContinue: () => void;
}

export default function SpyElimination({
  player,
  remainingPlayers,
  onContinue,
}: SpyEliminationProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <Skull size={46} />
      </div>

      <p className="mt-7 text-sm font-bold uppercase tracking-wider text-rose-500">
        Người chơi đã bị loại
      </p>

      <h1 className="mt-3 text-center text-3xl font-black text-slate-900 sm:text-4xl">
        {player.name}
      </h1>

      <p className="mt-4 max-w-sm text-center text-sm leading-6 text-slate-500">
        Người chơi này đã nhận được nhiều phiếu bầu nhất và phải rời khỏi cuộc
        chơi.
      </p>

      <div className="mt-6 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Users size={22} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Người chơi còn lại
          </p>
          <p className="text-xl font-black text-slate-900">
            {remainingPlayers} người
          </p>
        </div>
      </div>

      <div className="mt-6 w-full max-w-sm">
        <button
          type="button"
          onClick={onContinue}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
        >
          Tiếp tục thảo luận
          <ArrowRight size={19} />
        </button>
      </div>
    </div>
  );
}
