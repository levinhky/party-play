"use client";

import { useState } from "react";
import {
  Trophy,
  Medal,
  History,
  ChevronDown,
  ChevronUp,
  Vote,
  UserRound,
  UserX,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type {
  SpyPlayer,
  SpyRole,
  SpyRoundResult,
  SpyWordPair,
  SpyMode,
  SpyVoteRound,
} from "@/types/spy";

interface SpyResultsProps {
  players: SpyPlayer[];
  wordPair: SpyWordPair | null;
  mode: SpyMode;
  winner: SpyRole | null;
  scores: Record<string, number>;
  roundResults: SpyRoundResult[];
  voteHistory: SpyVoteRound[];
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

interface LeaderboardPlayer extends SpyPlayer {
  score: number;
}

export default function SpyResults({
  players,
  wordPair,
  winner,
  scores,
  roundResults,
  voteHistory,
  onPlayAgain,
  onBackToSetup,
}: SpyResultsProps) {
  const [showVoteHistory, setShowVoteHistory] = useState(true);

  const leaderboard: LeaderboardPlayer[] = [...players]
    .map((player) => ({
      ...player,
      score: scores[player.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const highestScore = leaderboard[0]?.score ?? 0;

  const winners = leaderboard.filter((player) => player.score === highestScore);

  const playerMap = new Map(players.map((player) => [player.id, player]));

  const totalVotes = voteHistory.reduce(
    (total, round) => total + round.votes.length,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-center text-white shadow-xl">
        <div className="mb-4 flex justify-center">
          <Trophy size={52} className="text-yellow-300" />
        </div>

        <h1 className="text-3xl font-black">Hoàn thành trò chơi!</h1>

        <p className="mt-2 text-violet-100">Ván chơi đã kết thúc.</p>

        {winner && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
            <Medal size={18} className="text-yellow-300" />
            <span className="text-sm font-bold">
              {winner === "spy"
                ? "Điệp viên chiến thắng"
                : "Dân thường chiến thắng"}
            </span>
          </div>
        )}

        {winners.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-violet-200">Người có điểm cao nhất</p>

            <p className="mt-1 text-2xl font-bold">
              {winners.map((player) => player.name).join(", ")}
            </p>

            <p className="mt-1 text-lg">{highestScore} điểm</p>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
          <Medal className="text-yellow-500" />
          Bảng xếp hạng
        </h2>

        <div className="space-y-3">
          {leaderboard.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                  index === 0
                    ? "bg-yellow-100 text-yellow-700"
                    : index === 1
                      ? "bg-gray-200 text-gray-700"
                      : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">
                  {player.name}
                </p>

                <p className="text-xs text-gray-500">
                  {player.wins ?? 0} chiến thắng
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-violet-700">
                  {player.score}
                </p>
                <p className="text-xs text-gray-400">điểm</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voting history */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowVoteHistory((value) => !value)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left transition hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <History size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Lịch sử bỏ phiếu
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {voteHistory.length} lượt bỏ phiếu · {totalVotes} phiếu
              </p>
            </div>
          </div>

          {showVoteHistory ? (
            <ChevronUp className="shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="shrink-0 text-gray-400" />
          )}
        </button>

        {showVoteHistory && (
          <div className="space-y-4 border-t border-gray-100 p-5">
            {voteHistory.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400">
                Ván chơi chưa có lượt bỏ phiếu nào.
              </p>
            ) : (
              voteHistory.map((round, index) => {
                const voteCounts: Record<string, number> = {};

                round.votes.forEach((vote) => {
                  voteCounts[vote.targetId] =
                    (voteCounts[vote.targetId] ?? 0) + 1;
                });

                const sortedCounts = Object.entries(voteCounts).sort(
                  (a, b) => b[1] - a[1],
                );

                const maxVotes = Math.max(0, ...Object.values(voteCounts));

                const highestVotedIds = Object.entries(voteCounts)
                  .filter(([, count]) => count === maxVotes)
                  .map(([id]) => id);

                const wasTie =
                  round.tiedPlayerIds.length > 0 ||
                  (highestVotedIds.length > 1 && maxVotes > 0);

                const eliminatedPlayer = round.eliminatedPlayerId
                  ? playerMap.get(round.eliminatedPlayerId)
                  : null;

                return (
                  <div
                    key={`${round.attempt}-${index}`}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-3 bg-gray-50 p-4">
                      <div>
                        <p className="font-bold text-gray-900">
                          Lượt bỏ phiếu {index + 1}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {round.votes.length} phiếu đã ghi nhận
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          wasTie
                            ? "bg-amber-100 text-amber-700"
                            : eliminatedPlayer
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {wasTie
                          ? "Hòa phiếu"
                          : eliminatedPlayer
                            ? "Đã loại"
                            : "Đã bỏ phiếu"}
                      </span>
                    </div>

                    <div className="space-y-3 p-4">
                      {/* Vote summary */}
                      {sortedCounts.length > 0 ? (
                        <div className="space-y-3">
                          {sortedCounts.map(([playerId, count]) => {
                            const player = playerMap.get(playerId);
                            if (!player) return null;

                            const percentage =
                              round.votes.length > 0
                                ? (count / round.votes.length) * 100
                                : 0;

                            return (
                              <div key={playerId}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                                  <span className="font-semibold text-gray-700">
                                    {player.name}
                                  </span>
                                  <span className="font-bold text-violet-700">
                                    {count} phiếu
                                  </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-violet-500 transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">
                          Không có phiếu hợp lệ.
                        </p>
                      )}

                      {/* Individual votes */}
                      <div className="border-t border-gray-100 pt-3">
                        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                          <Vote size={15} />
                          Chi tiết từng phiếu
                        </p>

                        <div className="space-y-2">
                          {round.votes.map((vote, voteIndex) => {
                            const voter = playerMap.get(vote.voterId);
                            const target = playerMap.get(vote.targetId);

                            return (
                              <div
                                key={`${vote.voterId}-${voteIndex}`}
                                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                              >
                                <UserRound
                                  size={15}
                                  className="shrink-0 text-gray-400"
                                />

                                <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                  {voter?.name ?? "Người chơi"}
                                </span>

                                <span className="shrink-0 text-xs text-gray-400">
                                  bình chọn
                                </span>

                                <span className="min-w-0 flex-1 truncate text-right font-semibold text-violet-700">
                                  {target?.name ?? "Không xác định"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Elimination result */}
                      {eliminatedPlayer && (
                        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                          <UserX size={17} className="shrink-0" />
                          <span>
                            <strong>{eliminatedPlayer.name}</strong> đã bị loại.
                          </span>
                        </div>
                      )}

                      {wasTie && !eliminatedPlayer && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                          <Vote size={17} className="shrink-0" />
                          <span>
                            Kết quả hòa, các người chơi đã tiến hành bỏ phiếu
                            lại.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Game result */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Kết quả ván chơi
        </h2>

        {roundResults.map((result) => (
          <div
            key={result.round}
            className="rounded-xl border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">Kết quả cuối cùng</p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  result.winner === "spy"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {result.winner === "spy"
                  ? "Điệp viên thắng"
                  : "Dân thường thắng"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Từ của dân thường</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {result.wordPair.word}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Từ của điệp viên</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {result.wordPair.spyWord}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Danh tính điệp viên
              </p>

              <div className="flex flex-wrap gap-2">
                {result.players
                  .filter((player) => player.role === "spy")
                  .map((player) => (
                    <span
                      key={player.id}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      {player.name}
                    </span>
                  ))}
              </div>
            </div>

            {result.guessCorrect !== undefined && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
                  result.guessCorrect
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.guessCorrect ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <XCircle size={17} />
                )}

                <span>
                  Điệp viên đoán từ:{" "}
                  <strong>
                    {result.guessCorrect ? "Chính xác" : "Không chính xác"}
                  </strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </section>

      {wordPair && (
        <p className="text-center text-xs text-gray-400">
          Từ khóa: {wordPair.word}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Chia ván mới
        </button>

        <button
          type="button"
          onClick={onBackToSetup}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Thay đổi cài đặt
        </button>
      </div>
    </div>
  );
}
