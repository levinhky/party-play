"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  DoorOpen,
  Loader2,
  Plus,
  Users,
  Wifi,
  Sparkles,
} from "lucide-react";

import { createSpyRoom, joinSpyRoom } from "@/services/spyRoomService";
import SpyOnlineLobby from "./SpyOnlineLobby";
import SpyOnlineSettings, {
  SPY_CUSTOM_WORDS_KEY,
  SPY_ONLINE_SETTINGS_KEY,
  type SpyOnlineSettingsValue,
} from "./SpyOnlineSettings";
import type { SpyWordPair } from "@/types/spy";

type Mode = "create" | "join";

const DEFAULT_SETTINGS: SpyOnlineSettingsValue = {
  spyCount: 1,
  mode: "different-word",
  category: "Tất cả chủ đề",
  discussionMinutes: 5,
  wordSource: "default",
  customWordPairs: [],
  spyCanSeeRole: true,
};

function isSpyWordPair(pair: unknown): pair is SpyWordPair {
  if (!pair || typeof pair !== "object") return false;
  const value = pair as Record<string, unknown>;
  return typeof value.id === "string"
    && typeof value.category === "string"
    && typeof value.word === "string"
    && typeof value.spyWord === "string";
}

function SpyOnlineForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomCodeFromUrl = searchParams.get("room");

  const [mode, setMode] = useState<Mode>("create");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<SpyOnlineSettingsValue>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedSettings = localStorage.getItem(SPY_ONLINE_SETTINGS_KEY);
        const savedCustomWords = localStorage.getItem(SPY_CUSTOM_WORDS_KEY);
        const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};
        const parsedCustomWords = savedCustomWords ? JSON.parse(savedCustomWords) : [];
        const customWordPairs = Array.isArray(parsedSettings.customWordPairs)
          ? parsedSettings.customWordPairs
          : parsedCustomWords;

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          customWordPairs: Array.isArray(parsedSettings.customWordPairs)
            && parsedSettings.customWordPairs.length > 0
            ? parsedSettings.customWordPairs.filter(isSpyWordPair)
            : Array.isArray(customWordPairs)
              ? customWordPairs.filter(isSpyWordPair)
              : [],
        });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setSettingsLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      localStorage.setItem(SPY_ONLINE_SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(SPY_CUSTOM_WORDS_KEY, JSON.stringify(settings.customWordPairs));
    } catch {
      // Keep the current form usable if browser storage is unavailable.
    }
  }, [settings, settingsLoaded]);

  if (roomCodeFromUrl) {
    return <SpyOnlineLobby roomCode={roomCodeFromUrl} />;
  }

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên người chơi.");
      return;
    }

    if (settings.wordSource === "custom" && settings.customWordPairs.length === 0) {
      setError("Hãy thêm ít nhất một cặp từ hoặc chọn nguồn từ khóa khác.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      localStorage.setItem(SPY_ONLINE_SETTINGS_KEY, JSON.stringify(settings));

      const session = await createSpyRoom(playerName);

      localStorage.setItem(
        "party-play-spy-room-session",
        JSON.stringify(session),
      );

      router.push(`/games/spy/online?room=${session.room_code}`);
    } catch (err) {
      console.error(err);
      setError("Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên người chơi.");
      return;
    }

    if (roomCode.trim().length !== 6) {
      setError("Mã phòng phải gồm 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const session = await joinSpyRoom(roomCode, playerName);

      localStorage.setItem(
        "party-play-spy-room-session",
        JSON.stringify(session),
      );

      router.push(`/games/spy/online?room=${session.room_code}`);
    } catch (err) {
      console.error(err);

      const message = err instanceof Error ? err.message : "";

      if (message.includes("ROOM_NOT_FOUND")) {
        setError("Không tìm thấy phòng này.");
      } else if (message.includes("ROOM_NOT_JOINABLE")) {
        setError("Phòng này đã bắt đầu hoặc đã kết thúc.");
      } else {
        setError("Không thể tham gia phòng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-8 text-gray-900 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-100/70 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-100/70 blur-[120px]" />

      <div className="relative mx-auto max-w-xl">
        <button
          onClick={() => router.push("/games/spy")}
          className="mb-10 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-sm">
            <Wifi size={30} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Sparkles size={14} />
            ONLINE MULTIPLAYER
          </div>

          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Who Is the{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Spy?
            </span>
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Chơi cùng bạn bè, dù mỗi người ở một nơi.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-100/80 sm:p-8">
          {/* Tabs */}
          <div className="mb-7 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                mode === "create"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Plus size={17} />
              Tạo phòng
            </button>

            <button
              onClick={() => {
                setMode("join");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                mode === "join"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <DoorOpen size={17} />
              Tham gia
            </button>
          </div>

          <div className="space-y-5">
            {/* Player name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tên người chơi
              </label>

              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                maxLength={30}
                placeholder="Nhập tên của bạn"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {mode === "create" && (
              <section className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900">Cấu hình ván chơi</h2>
                  <p className="mt-1 text-sm text-gray-500">Chọn luật và từ khóa trước khi tạo phòng.</p>
                </div>
                <SpyOnlineSettings
                  playerCount={null}
                  settings={settings}
                  onChange={setSettings}
                />
              </section>
            )}

            {/* Room code */}
            {mode === "join" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Mã phòng
                </label>

                <input
                  value={roomCode}
                  onChange={(event) =>
                    setRoomCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  maxLength={6}
                  placeholder="VD: A8K2PQ"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-violet-700 outline-none transition placeholder:text-gray-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Nhập mã gồm 6 ký tự do Host chia sẻ.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={mode === "create" ? handleCreateRoom : handleJoinRoom}
              disabled={loading || !settingsLoaded}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === "create" ? (
                <>
                  <Plus size={19} />
                  Tạo phòng mới
                </>
              ) : (
                <>
                  <Users size={19} />
                  Tham gia phòng
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Rủ bạn bè tham gia và cùng tìm ra kẻ nói dối!
        </p>
      </div>
    </main>
  );
}

export default function SpyOnlinePage() {
  return <SpyOnlineForm />;
}
