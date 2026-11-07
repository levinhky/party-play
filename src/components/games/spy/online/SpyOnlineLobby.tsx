"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Loader2,
  RefreshCw,
  Users,
  Wifi,
  Clock3,
  Sparkles,
  Play,
} from "lucide-react";

import {
  createSpyRoom,
  getSpyRoom,
  getSpyRoomPlayers,
  replaySpyRoom,
  startSpyRoom,
  subscribeSpyRoom,
  subscribeSpyRoomPlayers,
} from "@/services/spyRoomService";

import type {
  SpyRoom,
  SpyRoomPlayer,
  SpyRoomSession,
} from "@/types/spy-online";

import SpyOnlinePlayerList from "./SpyOnlinePlayerList";
import SpyOnlineSettings, {
  SPY_ONLINE_SETTINGS_KEY,
  type SpyOnlineSettingsValue,
} from "./SpyOnlineSettings";
import SpyOnlineGame from "./SpyOnlineGame";
import { spyWordPairs } from "@/data/spyWords";

const DEFAULT_SETTINGS: SpyOnlineSettingsValue = {
  spyCount: 1,
  mode: "different-word",
  category: "Tất cả chủ đề",
  discussionMinutes: 5,
  wordSource: "default",
  customWordPairs: [],
  spyCanSeeRole: true,
};

interface Props {
  roomCode: string;
}

export default function SpyOnlineLobby({ roomCode }: Props) {
  const router = useRouter();

  const [session, setSession] = useState<SpyRoomSession | null>(null);
  const [room, setRoom] = useState<SpyRoom | null>(null);
  const [players, setPlayers] = useState<SpyRoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [settings, setSettings] = useState<SpyOnlineSettingsValue>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadLobby = useCallback(async (roomId: string) => {
    const [roomData, playerData] = await Promise.all([
      getSpyRoom(roomId),
      getSpyRoomPlayers(roomId),
    ]);

    setRoom(roomData);
    setPlayers(playerData);
    if (playerData.length >= 4) {
      const maxSpyCount = Math.max(1, Math.floor(playerData.length / 3));
      setSettings((current) => current.spyCount > maxSpyCount
        ? { ...current, spyCount: maxSpyCount }
        : current);
    }
  }, []);

  useEffect(() => {
    let unsubscribeRoom: (() => void) | undefined;
    let unsubscribePlayers: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        setError("");

        const rawSession = localStorage.getItem("party-play-spy-room-session");

        if (!rawSession) {
          throw new Error("SESSION_NOT_FOUND");
        }

        const savedSession = JSON.parse(rawSession) as SpyRoomSession;

        const savedSettings = localStorage.getItem(SPY_ONLINE_SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings) as Partial<SpyOnlineSettingsValue>;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsedSettings,
            customWordPairs: Array.isArray(parsedSettings.customWordPairs)
              ? parsedSettings.customWordPairs
              : [],
          });
        }
        setSettingsLoaded(true);

        if (savedSession.room_code !== roomCode.toUpperCase()) {
          throw new Error("INVALID_SESSION");
        }

        if (cancelled) return;

        setSession(savedSession);

        await loadLobby(savedSession.room_id);

        if (cancelled) return;

        unsubscribeRoom = subscribeSpyRoom(
          savedSession.room_id,
          (updatedRoom) => setRoom(updatedRoom),
        );

        unsubscribePlayers = subscribeSpyRoomPlayers(
          savedSession.room_id,
          setPlayers,
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Không thể tải phòng. Vui lòng kiểm tra lại phiên chơi.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      unsubscribeRoom?.();
      unsubscribePlayers?.();
    };
  }, [roomCode, loadLobby]);

  useEffect(() => {
    if (!settingsLoaded || !session?.is_host) return;
    try {
      localStorage.setItem(SPY_ONLINE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // The saved host configuration remains available for this session.
    }
  }, [settings, settingsLoaded, session?.is_host]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode.toUpperCase());
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép mã phòng.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Who Is the Spy?",
      text: `Tham gia phòng ${roomCode.toUpperCase()} để chơi Who Is the Spy cùng mình!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Không thể chia sẻ phòng.");
      }
    }
  };

  const handleRefresh = async () => {
    if (!session) return;

    try {
      setRefreshing(true);
      setError("");
      await loadLobby(session.room_id);
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật danh sách người chơi.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleStart = async () => {
    if (!session?.is_host || !room || room.status === "finished" || players.length < 4) return;

    const sourcePairs = settings.wordSource === "custom"
      ? settings.customWordPairs
      : settings.wordSource === "all"
        ? [...spyWordPairs, ...settings.customWordPairs]
        : spyWordPairs;
    if (sourcePairs.length === 0) {
      setError("Nguồn từ khóa tự tạo đang trống. Hãy thêm cặp từ hoặc chọn nguồn khác.");
      return;
    }
    const matchingPairs = sourcePairs.filter(
      (pair) => settings.category === "Tất cả chủ đề" || pair.category === settings.category,
    );
    const wordPool = matchingPairs.length > 0 ? matchingPairs : sourcePairs;
    const wordPair = wordPool[Math.floor(Math.random() * wordPool.length)];
    if (!wordPair) {
      setError("Không tìm thấy từ khóa phù hợp để bắt đầu.");
      return;
    }

    try {
      setStarting(true);
      setError("");
      const startedRoom = await startSpyRoom(
        session.room_id,
        session.player_id,
        settings,
        wordPair,
      );
      setRoom(startedRoom);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ROOM_NOT_WAITING")) {
        setError("Phòng đã bắt đầu hoặc đã kết thúc. Hãy làm mới trạng thái.");
      } else if (message.includes("NOT_ROOM_HOST")) {
        setError("Chỉ Host của phòng mới có thể bắt đầu trò chơi.");
      } else if (message.includes("NOT_ENOUGH_PLAYERS")) {
        setError("Cần ít nhất 4 người chơi để bắt đầu.");
      } else if (message.includes("start_spy_room") || message.includes("function")) {
        setError("Thiếu hàm start_spy_room trong Supabase. Cần áp dụng migration của dự án.");
      } else {
        setError("Không thể bắt đầu trò chơi. Vui lòng thử lại.");
      }
    } finally {
      setStarting(false);
    }
  };

  const handleReplayRoom = async () => {
    if (!session?.is_host || !room || replaying) return;
    try {
      setReplaying(true);
      setError("");
      const waitingRoom = await replaySpyRoom(room.id, session.player_id);
      const roomPlayers = await getSpyRoomPlayers(room.id);
      setRoom(waitingRoom);
      setPlayers(roomPlayers);
    } catch (err) {
      console.error(err);
      setError("Không thể tạo lại ván trong phòng này. Hãy thử làm mới phòng.");
    } finally {
      setReplaying(false);
    }
  };

  const handleStartOver = async () => {
    if (!session?.is_host || creatingRoom) return;
    const host = players.find((player) => player.id === session.player_id);
    if (!host) {
      setError("Không tìm thấy thông tin Host để tạo phòng mới.");
      return;
    }
    try {
      setCreatingRoom(true);
      setError("");
      const newSession = await createSpyRoom(host.player_name);
      localStorage.setItem("party-play-spy-room-session", JSON.stringify(newSession));
      router.push(`/games/spy/online?room=${newSession.room_code}`);
    } catch (err) {
      console.error(err);
      setError("Không thể tạo phòng mới. Hãy thử lại.");
      setCreatingRoom(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin text-violet-600" />
          Đang tải phòng...
        </div>
      </main>
    );
  }

  if (!session || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Wifi size={26} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Không thể mở phòng
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error || "Không tìm thấy phòng."}
          </p>

          <button
            onClick={() => router.push("/games/spy/online")}
            className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  const isHost = session.is_host;

  if (room.status === "playing") {
    return (
      <SpyOnlineGame
        room={room}
        session={session}
        players={players}
        onRoomChange={setRoom}
        onPlayerChange={(updatedPlayer) =>
          setPlayers((current) =>
            current.map((player) => player.id === updatedPlayer.id ? updatedPlayer : player),
          )
        }
        onRepairRoles={handleStart}
        repairing={starting}
        onReplayRoom={handleReplayRoom}
        onStartOver={handleStartOver}
        replaying={replaying}
        creatingRoom={creatingRoom}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-8 text-gray-900 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-100/60 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-100/60 blur-[120px]" />

      <div className="relative mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/games/spy/online")}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-sm">
            <Users size={28} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {room.status === "waiting" ? "PHÒNG ĐANG CHỜ" : "TRÒ CHƠI ĐÃ BẮT ĐẦU"}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Waiting Room
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {room.status === "waiting"
              ? "Mời bạn bè tham gia để bắt đầu cuộc chơi."
              : "Host đã bắt đầu ván chơi. Mọi người đã sẵn sàng!"}
          </p>
        </div>

        {/* Room code */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 text-center shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
              <Sparkles size={15} className="text-violet-500" />
              MÃ PHÒNG CỦA BẠN
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-4xl font-black tracking-[0.2em] text-violet-700 sm:text-5xl">
                {room.room_code}
              </span>

              <button
                onClick={handleCopyCode}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-600 shadow-sm transition hover:bg-violet-50"
                aria-label="Sao chép mã phòng"
                title="Sao chép mã phòng"
              >
                {copied ? (
                  <Check size={20} className="text-green-600" />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Chia sẻ mã này với bạn bè để họ tham gia.
            </p>

            <button
              onClick={handleShare}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              <Users size={17} />
              Mời bạn bè
            </button>

            {copied && (
              <p className="mt-3 text-xs font-medium text-green-600">
                Đã sao chép thành công!
              </p>
            )}
          </div>
        </section>

        {/* Players */}
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Người chơi</h2>

              <p className="mt-1 text-sm text-gray-500">
                {players.length} người đã tham gia
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50"
              aria-label="Làm mới danh sách"
              title="Làm mới"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>

          <SpyOnlinePlayerList
            players={players}
            currentPlayerId={session.player_id}
          />

          <div className="mt-7 border-t border-gray-100 pt-6">
            {isHost ? (
              <SpyOnlineSettings
                playerCount={players.length}
                settings={settings}
                onChange={setSettings}
                disabled={room.status !== "waiting"}
              />
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Host đang chọn số Spy, chế độ chơi và chủ đề từ khóa.
              </p>
            )}
          </div>

          {/* Room information */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              {isHost ? <Crown size={18} /> : <Clock3 size={18} />}
            </div>

            <div>
              <p className="text-sm font-semibold text-violet-900">
                {room.status !== "waiting"
                  ? "Ván chơi đã bắt đầu"
                  : isHost
                    ? "Bạn là Host của phòng này"
                    : "Đang chờ Host"}
              </p>

              <p className="mt-1 text-xs leading-5 text-violet-700">
                {room.status !== "waiting"
                  ? "Phòng đã chuyển sang trạng thái đang chơi."
                  : isHost
                    ? "Hãy chia sẻ mã phòng và đợi ít nhất 4 người tham gia trước khi bắt đầu."
                    : "Bạn đã vào phòng thành công. Hãy đợi Host bắt đầu trò chơi."}
              </p>
            </div>
          </div>

          {/* Start game */}
          <button
            onClick={handleStart}
            disabled={!isHost || room.status !== "waiting" || players.length < 4 || starting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            {starting ? <Loader2 size={19} className="animate-spin" /> : <Play size={18} />}
            {room.status !== "waiting"
              ? "Trò chơi đã bắt đầu"
              : starting
                ? "Đang bắt đầu..."
                : isHost
                  ? players.length < 4
                    ? `Cần ít nhất 4 người chơi (${players.length}/4)`
                    : "Bắt đầu trò chơi"
                  : "Đang chờ Host bắt đầu..."}
          </button>

          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {room.status === "waiting" && players.length < 4 && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Cần ít nhất 4 người chơi để bắt đầu.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
