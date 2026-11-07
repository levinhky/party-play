"use client";

import { useState } from "react";
import {
  Users,
  UserX,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Skull,
} from "lucide-react";

import type { SpyPlayer } from "@/types/spy";

interface SpyPlayerStatusProps {
  players: SpyPlayer[];
}

export default function SpyPlayerStatus({ players }: SpyPlayerStatusProps) {
  const [showEliminated, setShowEliminated] = useState(true);

  const activePlayers = players.filter((player) => !player.isEliminated);

  const eliminatedPlayers = players.filter((player) => player.isEliminated);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users size={19} className="text-violet-600" />

            <h2 className="text-lg font-black text-slate-900">
              Tình hình người chơi
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Theo dõi những người còn trong cuộc chơi
          </p>
        </div>

        <span className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">
          {activePlayers.length}/{players.length}
        </span>
      </div>

      {/* Statistics */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CircleCheck size={20} />
          </div>

          <div>
            <p className="text-2xl font-black text-emerald-700">
              {activePlayers.length}
            </p>

            <p className="text-xs font-semibold text-emerald-700">Đang chơi</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Skull size={20} />
          </div>

          <div>
            <p className="text-2xl font-black text-slate-600">
              {eliminatedPlayers.length}
            </p>

            <p className="text-xs font-semibold text-slate-500">Đã bị loại</p>
          </div>
        </div>
      </div>

      {/* Active players */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Người chơi còn lại
          </h3>

          <span className="text-xs font-semibold text-emerald-600">
            {activePlayers.length} người
          </span>
        </div>

        {activePlayers.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activePlayers.map((player) => {
              const playerNumber = players.findIndex(
                (item) => item.id === player.id,
              );

              return (
                <div
                  key={player.id}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-700">
                      {player.name}
                    </p>

                    <p className="text-[10px] font-medium text-emerald-600">
                      Người chơi {playerNumber + 1}
                    </p>
                  </div>

                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">
            Không còn người chơi nào.
          </p>
        )}
      </div>

      {/* Eliminated players */}
      {eliminatedPlayers.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowEliminated((value) => !value)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <UserX size={17} className="text-slate-400" />
              Người chơi đã bị loại ({eliminatedPlayers.length})
            </span>

            {showEliminated ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>

          {showEliminated && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {eliminatedPlayers.map((player) => {
                const playerNumber = players.findIndex(
                  (item) => item.id === player.id,
                );

                return (
                  <div
                    key={player.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 opacity-70"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-500">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-500 line-through">
                        {player.name}
                      </p>

                      <p className="text-[10px] font-medium text-rose-500">
                        Người chơi {playerNumber + 1} · Đã loại
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
