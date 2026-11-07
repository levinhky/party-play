"use client";

import { Loader2, RotateCcw, Users, Vote } from "lucide-react";
import type { SpyRoomPlayer, SpyRoomVote } from "@/types/spy-online";

interface Props {
  players: SpyRoomPlayer[];
  votes: SpyRoomVote[];
  isHost: boolean;
  onReplayRoom: () => void;
  onStartOver: () => void;
  replaying: boolean;
  creatingRoom: boolean;
}

export default function SpyOnlineVoteResults({
  players,
  votes,
  isHost,
  onReplayRoom,
  onStartOver,
  replaying,
  creatingRoom,
}: Props) {
  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote.target_id, (counts.get(vote.target_id) ?? 0) + 1);
  const highest = Math.max(0, ...counts.values());
  const leaders = players.filter((player) => counts.get(player.id) === highest && highest > 0);
  const tied = leaders.length > 1;
  const busy = replaying || creatingRoom;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-300/15 text-violet-200">
          <Vote size={23} />
        </div>
        <h2 className="text-2xl font-black">{tied ? "Kết quả hòa phiếu" : "Kết quả bỏ phiếu"}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {votes.length} phiếu đã được ghi nhận
        </p>
      </div>

      {leaders.length > 0 && (
        <div className="mb-5 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-200">
            {tied ? "Những người nhận nhiều phiếu nhất" : "Người nhận nhiều phiếu nhất"}
          </p>
          <p className="mt-2 text-xl font-black text-white">
            {leaders.map((player) => player.player_name).join(" · ")}
          </p>
          <p className="mt-1 text-sm text-violet-100/80">{highest} phiếu</p>
        </div>
      )}

      <div className="space-y-2">
        {players.map((player) => {
          const count = counts.get(player.id) ?? 0;
          const width = votes.length ? `${Math.round((count / votes.length) * 100)}%` : "0%";
          return (
            <div key={player.id} className="rounded-xl bg-slate-950/40 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-slate-100">{player.player_name}</span>
                <span className="shrink-0 font-bold text-violet-200">{count} phiếu</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Lịch sử bỏ phiếu</h3>
        <div className="space-y-2">
          {votes.map((vote) => {
            const voter = players.find((player) => player.id === vote.voter_id);
            const target = players.find((player) => player.id === vote.target_id);
            if (!voter || !target) return null;
            return (
              <div key={vote.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/40 px-4 py-3 text-sm">
                <span className="truncate font-medium text-slate-200">{voter.player_name}</span>
                <span className="shrink-0 text-slate-500">bỏ phiếu cho</span>
                <span className="max-w-[40%] truncate text-right font-semibold text-violet-200">{target.player_name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isHost ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={onReplayRoom} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 font-bold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
            {replaying ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
            Chơi lại với phòng này
          </button>
          <button onClick={onStartOver} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 font-bold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
            {creatingRoom ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
            Bắt đầu lại từ đầu
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-950/40 px-4 py-3 text-center text-sm text-slate-300">
          Đang chờ Host chọn chơi lại với phòng này hoặc bắt đầu phòng mới.
        </p>
      )}
    </section>
  );
}
