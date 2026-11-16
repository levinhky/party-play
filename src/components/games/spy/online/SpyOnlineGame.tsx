"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  Wifi,
} from "lucide-react";

import {
  advanceSpyDiscussion,
  castSpyRoomVote,
  completeSpyVoting,
  getSpyRoomVotes,
  getMySpyRoomRole,
  getMySpyRoomVote,
  setSpyPlayerReady,
  startSpyDiscussion,
} from "@/services/spyRoomService";
import type {
  SpyRoom,
  SpyRoomPlayer,
  SpyRoomRole,
  SpyRoomSession,
  SpyRoomVote,
} from "@/types/spy-online";
import SpyOnlineVoteResults from "./SpyOnlineVoteResults";

interface Props {
  room: SpyRoom;
  session: SpyRoomSession;
  players: SpyRoomPlayer[];
  onRoomChange: (room: SpyRoom) => void;
  onPlayerChange: (player: SpyRoomPlayer) => void;
  onRepairRoles: () => void;
  repairing: boolean;
  onReplayRoom: () => void;
  onStartOver: () => void;
  replaying: boolean;
  creatingRoom: boolean;
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SpyOnlineGame({
  room,
  session,
  players,
  onRoomChange,
  onPlayerChange,
  onRepairRoles,
  repairing,
  onReplayRoom,
  onStartOver,
  replaying,
  creatingRoom,
}: Props) {
  const [role, setRole] = useState<SpyRoomRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState("");
  const [gameError, setGameError] = useState("");
  const [readySaving, setReadySaving] = useState(false);
  const [discussionStarting, setDiscussionStarting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [vote, setVote] = useState<SpyRoomVote | null>(null);
  const [voteTargetId, setVoteTargetId] = useState("");
  const [voteSaving, setVoteSaving] = useState(false);
  const [allVotes, setAllVotes] = useState<SpyRoomVote[]>([]);
  const [loadedResultsKey, setLoadedResultsKey] = useState("");
  const advanceInFlight = useRef(false);
  const completingVoteInFlight = useRef(false);

  const me = players.find((player) => player.id === session.player_id);
  const isReady = me?.is_ready ?? false;
  const readyCount = players.filter((player) => player.is_ready).length;
  const everyoneReady = players.length >= 4 && readyCount === players.length;
  const activePlayers = players.filter((player) => !player.is_eliminated);
  const everyoneVoted = activePlayers.length > 0 && activePlayers.every((player) => player.has_voted);
  const candidates = useMemo(
    () => players.filter((player) => player.id !== session.player_id && !player.is_eliminated),
    [players, session.player_id],
  );
  const activeVote = room.current_phase === "voting"
    && vote?.round_number === room.current_round
    ? vote
    : null;

  const loadRole = useCallback(async () => {
    try {
      const currentRole = await getMySpyRoomRole(room.id, session.player_id);
      setRole(currentRole);
      setRoleError("");
    } catch (err) {
      console.error(err);
      setRoleError("Không thể tải vai trò của bạn. Hãy thử tải lại.");
    } finally {
      setLoadingRole(false);
    }
  }, [room.id, session.player_id]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pollRole = async () => {
      try {
        const currentRole = await getMySpyRoomRole(room.id, session.player_id);
        if (cancelled) return;
        setRole(currentRole);
        setRoleError("");
        setLoadingRole(false);
        if (!currentRole) timer = setTimeout(pollRole, 2500);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setRoleError("Không thể tải vai trò của bạn. Hãy thử tải lại.");
          setLoadingRole(false);
        }
      }
    };

    void pollRole();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [room.id, session.player_id]);

  useEffect(() => {
    if (room.current_phase !== "voting") return;

    let cancelled = false;
    void getMySpyRoomVote(room.id, room.current_round, session.player_id)
      .then((currentVote) => {
        if (cancelled) return;
        setVote(currentVote);
        setVoteTargetId(currentVote?.target_id ?? "");
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setGameError("Không thể tải lá phiếu của bạn.");
      });

    return () => {
      cancelled = true;
    };
  }, [room.current_phase, room.current_round, room.id, session.player_id]);

  useEffect(() => {
    if (room.current_phase !== "voting") {
      completingVoteInFlight.current = false;
      return;
    }
    if (!everyoneVoted || completingVoteInFlight.current) return;
    let cancelled = false;
    completingVoteInFlight.current = true;
    void completeSpyVoting(room.id)
      .then((updatedRoom) => {
        if (!cancelled) onRoomChange(updatedRoom);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setGameError("Không thể mở kết quả bỏ phiếu. Hãy làm mới phòng để thử lại.");
        completingVoteInFlight.current = false;
      });
    return () => { cancelled = true; };
  }, [room.current_phase, room.id, everyoneVoted, onRoomChange]);

  useEffect(() => {
    if (room.current_phase !== "vote-results") return;
    let cancelled = false;
    void getSpyRoomVotes(room.id, room.current_round)
      .then((currentVotes) => {
        if (!cancelled) {
          setAllVotes(currentVotes);
          setLoadedResultsKey(`${room.id}:${room.current_round}`);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setGameError("Không thể tải kết quả bỏ phiếu.");
      });
    return () => { cancelled = true; };
  }, [room.current_phase, room.current_round, room.id]);

  useEffect(() => {
    if (room.current_phase !== "discussion" || !room.discussion_ends_at) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      const remaining = Date.parse(room.discussion_ends_at!) - Date.now();
      setRemainingMs(Math.max(0, remaining));

      if (remaining > 0) {
        timer = setTimeout(tick, Math.min(500, remaining));
        return;
      }

      if (advanceInFlight.current) return;
      advanceInFlight.current = true;
      setAdvancing(true);

      try {
        const updatedRoom = await advanceSpyDiscussion(room.id, session.player_id);
        if (!cancelled) {
          onRoomChange(updatedRoom);
          setGameError("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setGameError("Không thể chuyển sang bỏ phiếu. Đang thử lại...");
          advanceInFlight.current = false;
          timer = setTimeout(tick, 1500);
        }
      } finally {
        if (!cancelled && advanceInFlight.current) setAdvancing(false);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [room.current_phase, room.discussion_ends_at, room.id, session.player_id, onRoomChange]);

  const handleReady = async () => {
    if (!me || readySaving) return;
    try {
      setReadySaving(true);
      setGameError("");
      const updatedPlayer = await setSpyPlayerReady(room.id, me.id, !isReady);
      onPlayerChange(updatedPlayer);
    } catch (err) {
      console.error(err);
      setGameError("Không thể cập nhật trạng thái sẵn sàng. Hãy thử lại.");
    } finally {
      setReadySaving(false);
    }
  };

  const handleStartDiscussion = async () => {
    if (!session.is_host || !everyoneReady || discussionStarting) return;
    try {
      setDiscussionStarting(true);
      setGameError("");
      const updatedRoom = await startSpyDiscussion(room.id, session.player_id);
      onRoomChange(updatedRoom);
    } catch (err) {
      console.error(err);
      setGameError("Chưa thể bắt đầu thảo luận. Hãy kiểm tra lại trạng thái sẵn sàng của mọi người.");
    } finally {
      setDiscussionStarting(false);
    }
  };

  const handleVote = async () => {
    if (!voteTargetId || voteSaving) return;
    try {
      setVoteSaving(true);
      setGameError("");
      const submittedVote = await castSpyRoomVote(room.id, session.player_id, voteTargetId);
      setVote(submittedVote);
    } catch (err) {
      console.error(err);
      setGameError("Không thể ghi nhận phiếu. Hãy thử lại.");
    } finally {
      setVoteSaving(false);
    }
  };

  const isSpy = role?.role === "spy";
  const showSpyRole = room.settings.spyCanSeeRole !== false;
  const roleTone = isSpy ? (showSpyRole ? "rose" : "blue") : "emerald";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f8ff] px-4 py-8 text-slate-900 sm:px-6">
      <div className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-blue-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-36 -right-36 h-96 w-96 rounded-full bg-blue-100/70 blur-[120px]" />

      <div className="relative mx-auto max-w-2xl">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Wifi size={25} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            Phòng {room.room_code} · Ván {room.current_round || 1}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {room.current_phase === "vote-results"
              ? "Kết quả bỏ phiếu"
              : room.current_phase === "reveal"
              ? "Xem vai trò"
              : room.current_phase === "discussion"
                ? "Thảo luận"
                : "Bỏ phiếu"}
          </h1>
        </header>

        {loadingRole ? (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-6 text-slate-600 shadow-sm">
            <Loader2 className="animate-spin text-blue-600" /> Đang tải vai trò...
          </div>
        ) : role ? (
          <section className={`mb-4 rounded-2xl border p-5 text-center ${roleTone === "rose" ? "border-rose-200 bg-rose-50" : roleTone === "blue" ? "border-blue-200 bg-blue-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${roleTone === "rose" ? "bg-rose-100 text-rose-700" : roleTone === "blue" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
              {isSpy && !showSpyRole ? <EyeOff size={23} /> : isSpy ? <Eye size={23} /> : <Shield size={23} />}
            </div>
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${roleTone === "rose" ? "text-rose-700" : roleTone === "blue" ? "text-blue-700" : "text-emerald-700"}`}>
              {isSpy
                ? showSpyRole ? "Bạn là gián điệp" : "Nhãn vai trò đang được ẩn"
                : "Bạn là Dân thường"}
            </p>
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-3.5">
              <p className="mb-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles size={13} /> Từ khóa bí mật
              </p>
              <p className="text-2xl font-black text-slate-900">
                {role.secret_word || "Bạn không có từ khóa"}
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="font-semibold text-blue-900">
              {roleError || "Ván này chưa có dữ liệu vai trò."}
            </p>
            {roleError ? (
              <button onClick={() => void loadRole()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                <RefreshCw size={16} /> Tải lại vai trò
              </button>
            ) : session.is_host ? (
              <button onClick={onRepairRoles} disabled={repairing} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {repairing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {repairing ? "Đang chia vai..." : "Chia vai cho ván này"}
              </button>
            ) : (
              <p className="mt-2 text-sm text-blue-800">Đang chờ quản trò chia vai...</p>
            )}
          </section>
        )}

        {role && room.current_phase === "reveal" && (
          <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Người chơi sẵn sàng</h2>
                <p className="mt-1 text-sm text-slate-500">{readyCount}/{players.length} đã sẵn sàng</p>
              </div>
              <Users className="text-blue-200" size={21} />
            </div>

            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="truncate pr-3 text-sm font-medium text-slate-700">
                    {player.player_name}{player.id === session.player_id ? " (Bạn)" : ""}
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${player.is_ready ? "text-emerald-700" : "text-slate-500"}`}>
                    {player.is_ready ? <Check size={14} /> : <Clock3 size={14} />}
                    {player.is_ready ? "Sẵn sàng" : "Đang xem vai"}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={handleReady} disabled={readySaving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {readySaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {readySaving ? "Đang cập nhật..." : isReady ? "Hủy sẵn sàng" : "Tôi đã xem vai trò"}
            </button>

            {session.is_host && (
              <button onClick={handleStartDiscussion} disabled={!everyoneReady || discussionStarting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3 font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40">
                {discussionStarting ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
                {discussionStarting ? "Đang bắt đầu..." : everyoneReady ? "Bắt đầu thảo luận" : "Chờ mọi người sẵn sàng"}
              </button>
            )}
          </section>
        )}

        {room.current_phase === "discussion" && (
          <section className="rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Clock3 size={24} />
            </div>
            <p className="text-sm font-semibold text-blue-700">Thời gian thảo luận còn</p>
            <p className="my-2 font-mono text-5xl font-black tabular-nums tracking-tight text-slate-900 sm:text-6xl">
              {formatTime(remainingMs)}
            </p>
            <p className="text-sm text-slate-600">Hãy trao đổi để tìm ra gián điệp. Đồng hồ được đồng bộ cho tất cả người chơi.</p>
            {advancing && <p className="mt-3 inline-flex items-center gap-2 text-sm text-blue-700"><Loader2 size={16} className="animate-spin" /> Đang mở phần bỏ phiếu...</p>}
          </section>
        )}

        {room.current_phase === "voting" && (
          <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black">Ai là gián điệp?</h2>
              <p className="mt-1 text-sm text-slate-500">Chọn một người chơi. Lá phiếu của bạn được giữ bí mật.</p>
            </div>

            <div className="space-y-2">
              {candidates.map((player) => {
                const selected = voteTargetId === player.id;
                return (
                  <button key={player.id} onClick={() => setVoteTargetId(player.id)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${selected ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}>
                    <span className="font-semibold">{player.player_name}</span>
                    {selected && <Check size={18} className="text-blue-700" />}
                  </button>
                );
              })}
            </div>

            <button onClick={handleVote} disabled={!voteTargetId || voteSaving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {voteSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {voteSaving ? "Đang ghi phiếu..." : activeVote ? "Cập nhật lá phiếu" : "Gửi lá phiếu"}
            </button>
            {activeVote && <p className="mt-3 text-center text-sm font-medium text-emerald-700">Đã ghi nhận phiếu của bạn. Bạn có thể đổi lựa chọn trước khi kết thúc.</p>}
          </section>
        )}

        {room.current_phase === "vote-results" && (
          loadedResultsKey !== `${room.id}:${room.current_round}` ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-8 text-slate-600 shadow-sm">
              <Loader2 className="animate-spin text-blue-600" /> Đang tổng hợp phiếu...
            </div>
          ) : (
            <SpyOnlineVoteResults
              players={players}
              votes={allVotes}
              isHost={session.is_host}
              onReplayRoom={onReplayRoom}
              onStartOver={onStartOver}
              replaying={replaying}
              creatingRoom={creatingRoom}
            />
          )
        )}

        {gameError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">{gameError}</p>}
      </div>
    </main>
  );
}
