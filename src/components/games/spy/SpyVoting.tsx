"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  ShieldCheck,
  Vote,
  Users,
  ChevronRight,
} from "lucide-react";

import type { SpyPlayer, SpyVote } from "@/types/spy";

interface SpyVotingProps {
  players: SpyPlayer[];
  tiedPlayerIds?: string[];
  onSubmit: (votes: SpyVote[]) => void;
}

export default function SpyVoting({
  players,
  tiedPlayerIds = [],
  onSubmit,
}: SpyVotingProps) {
  const eligiblePlayers = players.filter((player) => !player.isEliminated);

  const candidates =
    tiedPlayerIds.length > 0
      ? eligiblePlayers.filter((player) => tiedPlayerIds.includes(player.id))
      : eligiblePlayers;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [votes, setVotes] = useState<SpyVote[]>([]);
  const [showPassDevice, setShowPassDevice] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPlayer = eligiblePlayers[currentIndex];

  if (eligiblePlayers.length < 2 || candidates.length < 2) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Vote className="mx-auto text-amber-600" size={36} />

        <h2 className="mt-4 text-xl font-black text-amber-900">
          Không thể tiếp tục bỏ phiếu
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Số lượng người chơi hoặc người được chọn không đủ để thực hiện lượt bỏ
          phiếu này.
        </p>
      </div>
    );
  }

  if (!currentPlayer) return null;

  function submitVote() {
    if (
      !currentPlayer ||
      !selectedTarget ||
      isSubmitting ||
      !candidates.some((player) => player.id === selectedTarget) ||
      selectedTarget === currentPlayer.id
    ) {
      return;
    }

    const nextVotes: SpyVote[] = [
      ...votes,
      {
        voterId: currentPlayer.id,
        targetId: selectedTarget,
      },
    ];

    // Người cuối cùng hoàn tất bỏ phiếu.
    if (currentIndex + 1 >= eligiblePlayers.length) {
      setIsSubmitting(true);
      onSubmit(nextVotes);
      return;
    }

    setVotes(nextVotes);
    setSelectedTarget("");
    setShowConfirm(false);
    setCurrentIndex((index) => index + 1);
    setShowPassDevice(true);
  }

  function continueVoting() {
    setShowPassDevice(false);
  }

  // Màn hình chuyển thiết bị.
  if (showPassDevice) {
    const nextPlayer = eligiblePlayers[currentIndex];

    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
            <ShieldCheck size={40} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-violet-600">
            Chuyển thiết bị
          </p>

          <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            Hãy chuyển điện thoại cho
          </h1>

          <div className="mt-5 rounded-2xl bg-violet-50 p-5">
            <p className="break-words text-2xl font-black text-violet-800">
              {nextPlayer.name}
            </p>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Đảm bảo người chơi trước không nhìn thấy lựa chọn của bạn. Chỉ tiếp
            tục khi bạn đã cầm thiết bị.
          </p>

          <button
            type="button"
            onClick={continueVoting}
            className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white transition hover:bg-violet-700"
          >
            Tôi đã sẵn sàng
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
          <Vote size={40} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">
          Ai là gián điệp?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {tiedPlayerIds.length > 0
            ? "Lượt bỏ phiếu lại: chỉ được chọn giữa những người đang hòa phiếu."
            : "Hãy chọn người mà bạn nghi ngờ nhất."}
        </p>
      </div>

      {/* Voting card */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">
            LƯỢT BỎ PHIẾU
          </span>

          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            {currentIndex + 1}/{eligiblePlayers.length}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / eligiblePlayers.length) * 100}%`,
            }}
          />
        </div>

        {/* Current voter */}
        <div className="mt-6 rounded-2xl bg-violet-50 p-5 text-center">
          <Eye className="mx-auto text-violet-600" size={25} />

          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-violet-500">
            Đến lượt bỏ phiếu
          </p>

          <h2 className="mt-2 break-words text-2xl font-black text-violet-900">
            {currentPlayer.name}
          </h2>

          <p className="mt-2 text-xs text-violet-600">
            Đảm bảo những người khác không nhìn thấy lựa chọn của bạn.
          </p>
        </div>

        {/* Candidates */}
        <div className="mt-7 flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900">Bạn nghi ngờ ai?</h3>

          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Users size={14} />
            {candidates.length - 1} người
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {candidates
            .filter((player) => player.id !== currentPlayer.id)
            .map((player) => {
              const active = selectedTarget === player.id;

              return (
                <button
                  key={player.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
                  }`}
                >
                  <span className="block break-words font-bold text-slate-800">
                    {player.name}
                  </span>

                  {active && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-700">
                      <Check size={14} />
                      Đã chọn
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={!selectedTarget || isSubmitting}
          onClick={() => setShowConfirm(true)}
          className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Xác nhận phiếu bầu
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Phiếu bầu sẽ được giữ bí mật cho đến khi mọi người hoàn tất.
        </p>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Vote size={28} />
            </div>

            <h2 className="mt-4 text-center text-xl font-black text-slate-900">
              Xác nhận bỏ phiếu?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              Bạn đang bỏ phiếu cho{" "}
              <strong className="text-violet-700">
                {
                  candidates.find((player) => player.id === selectedTarget)
                    ?.name
                }
              </strong>
              .
            </p>

            <p className="mt-2 text-center text-xs text-slate-400">
              Bạn sẽ không thể thay đổi phiếu sau khi xác nhận.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-xl border border-slate-200 font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Chọn lại
              </button>

              <button
                type="button"
                onClick={submitVote}
                className="h-12 rounded-xl bg-violet-600 font-bold text-white transition hover:bg-violet-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
