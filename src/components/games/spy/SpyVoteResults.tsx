"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Vote,
  History,
  ChevronDown,
  ChevronUp,
  UserRound,
  Users,
} from "lucide-react";

import type { SpyPlayer, SpyVote } from "@/types/spy";

interface SpyVoteResultsProps {
  players: SpyPlayer[];
  votes: SpyVote[];
  onContinue: (tiedPlayerIds: string[]) => void;
}

export default function SpyVoteResults({
  players,
  votes,
  onContinue,
}: SpyVoteResultsProps) {
  const [showHistory, setShowHistory] = useState(true);

  const activePlayers = useMemo(
    () => players.filter((player) => !player.isEliminated),
    [players],
  );

  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  // Chỉ tính phiếu từ người còn hoạt động,
  // không cho phép tự bỏ phiếu hoặc bỏ phiếu cho người đã bị loại.
  // Mỗi người chỉ được tính một phiếu.
  const validVotes = useMemo(() => {
    const activePlayerIds = new Set(activePlayers.map((player) => player.id));

    const seenVoters = new Set<string>();

    return votes.filter((vote) => {
      const isValid =
        activePlayerIds.has(vote.voterId) &&
        activePlayerIds.has(vote.targetId) &&
        vote.voterId !== vote.targetId &&
        !seenVoters.has(vote.voterId);

      if (isValid) {
        seenVoters.add(vote.voterId);
      }

      return isValid;
    });
  }, [votes, activePlayers]);

  // Đếm số phiếu nhận được.
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    validVotes.forEach((vote) => {
      counts[vote.targetId] = (counts[vote.targetId] ?? 0) + 1;
    });

    return counts;
  }, [validVotes]);

  const sortedPlayers = useMemo(
    () =>
      [...activePlayers].sort(
        (a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0),
      ),
    [activePlayers, voteCounts],
  );

  const maxVotes = Math.max(0, ...Object.values(voteCounts));

  const tiedPlayers =
    maxVotes > 0
      ? sortedPlayers.filter(
          (player) => (voteCounts[player.id] ?? 0) === maxVotes,
        )
      : [];

  const isTie = tiedPlayers.length > 1;

  const eliminatedPlayer =
    !isTie && tiedPlayers.length === 1 ? tiedPlayers[0] : null;

  const hasValidVotes = validVotes.length > 0;

  const hasCompleteVotes = validVotes.length === activePlayers.length;

  const votePercentage = (count: number) =>
    validVotes.length > 0 ? (count / validVotes.length) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-2xl py-6 sm:py-10">
      {/* Header */}
      <div className="text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
            isTie
              ? "bg-amber-100 text-amber-600"
              : "bg-violet-100 text-violet-600"
          }`}
        >
          {isTie ? <AlertTriangle size={40} /> : <Vote size={40} />}
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">
          Kết quả bỏ phiếu
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Tất cả phiếu bầu đã được công khai.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {/* Voting result */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {isTie ? (
            <div className="rounded-2xl bg-amber-50 p-5 text-center">
              <AlertTriangle className="mx-auto text-amber-600" size={28} />

              <h2 className="mt-3 text-xl font-black text-amber-900">
                Hòa phiếu!
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Có {tiedPlayers.length} người nhận được số phiếu cao nhất. Nhóm
                sẽ bỏ phiếu lại giữa những người này.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {tiedPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-amber-800"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          ) : eliminatedPlayer ? (
            <div className="rounded-2xl bg-rose-50 p-5 text-center">
              <CheckCircle2 className="mx-auto text-rose-600" size={28} />

              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-rose-600">
                Người bị nghi ngờ nhiều nhất
              </p>

              <h2 className="mt-2 break-words text-2xl font-black text-rose-900">
                {eliminatedPlayer.name}
              </h2>

              <p className="mt-2 text-sm text-rose-700">
                Nhận được {maxVotes} phiếu bầu.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <AlertTriangle className="mx-auto text-slate-500" size={28} />

              <h2 className="mt-3 text-lg font-black text-slate-800">
                Chưa có kết quả bỏ phiếu
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Không có phiếu hợp lệ trong lượt này.
              </p>
            </div>
          )}

          {/* Vote statistics */}
          <div className="mt-7 flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900">Tổng hợp phiếu bầu</h3>

            <span className="text-xs font-medium text-slate-400">
              {validVotes.length}/{activePlayers.length} phiếu hợp lệ
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {sortedPlayers.map((player) => {
              const count = voteCounts[player.id] ?? 0;
              const percentage = votePercentage(count);
              const isHighest = count === maxVotes && maxVotes > 0;

              return (
                <div key={player.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`break-words font-semibold ${
                        isHighest ? "text-rose-700" : "text-slate-700"
                      }`}
                    >
                      {player.name}
                    </span>

                    <span className="shrink-0 text-sm font-bold text-slate-500">
                      {count} phiếu
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighest ? "bg-rose-500" : "bg-violet-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!hasCompleteVotes && hasValidVotes && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />

              <p>
                Một số phiếu không hợp lệ hoặc bị thiếu. Kết quả chỉ tính những
                phiếu hợp lệ.
              </p>
            </div>
          )}
        </section>

        {/* Voting history */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className="flex w-full items-center justify-between gap-3 p-5 text-left transition hover:bg-slate-50 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <History size={21} />
              </div>

              <div>
                <h3 className="font-black text-slate-900">Lịch sử bỏ phiếu</h3>

                <p className="mt-1 text-xs text-slate-500">
                  {validVotes.length} lượt bỏ phiếu hợp lệ
                </p>
              </div>
            </div>

            {showHistory ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-slate-100 p-5 sm:p-6">
              {validVotes.length > 0 ? (
                <div className="space-y-3">
                  {validVotes.map((vote, index) => {
                    const voter = playerMap.get(vote.voterId);
                    const target = playerMap.get(vote.targetId);

                    if (!voter || !target) return null;

                    return (
                      <div
                        key={`${vote.voterId}-${vote.targetId}-${index}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                          <UserRound size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {voter.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Đã bỏ phiếu cho
                          </p>
                        </div>

                        <div className="max-w-[45%] rounded-xl bg-rose-50 px-3 py-2">
                          <p className="truncate text-sm font-bold text-rose-700">
                            {target.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-5 text-center text-sm text-slate-400">
                  Chưa có lịch sử bỏ phiếu.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Player count */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Users size={15} />
          {activePlayers.length} người chơi tham gia lượt bỏ phiếu
        </div>
      </div>

      {/* Continue */}
      <button
        type="button"
        onClick={() =>
          onContinue(isTie ? tiedPlayers.map((player) => player.id) : [])
        }
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700 active:scale-[0.99]"
      >
        {isTie ? "Bỏ phiếu lại" : "Tiếp tục"}
      </button>
    </div>
  );
}
