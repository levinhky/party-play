"use client";

import BackToGamesButton from "@/components/games/BackToGamesButton";
import {
  Minus,
  Pause,
  Plus,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ClockPlayer {
  id: number;
  name: string;
  remainingMs: number;
}

const STORAGE_KEY = "party-play-chess-clock-settings";

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ChessClock() {
  const [players, setPlayers] = useState<ClockPlayer[]>([
    { id: 1, name: "Người chơi 1", remainingMs: 60_000 },
    { id: 2, name: "Người chơi 2", remainingMs: 60_000 },
  ]);
  const [turnSeconds, setTurnSeconds] = useState("60");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualPulse, setVisualPulse] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickingIntervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw) as {
          players?: Array<{ id: number; name: string }>;
          turnSeconds?: string;
        };

        if (Array.isArray(saved.players) && saved.players.length > 0) {
          const seconds = Number(saved.turnSeconds ?? "60");
          const durationMs = seconds * 1000;

          setPlayers(
            saved.players.map((player) => ({
              id: player.id,
              name: player.name,
              remainingMs: durationMs,
            })),
          );
        }

        if (saved.turnSeconds !== undefined) setTurnSeconds(saved.turnSeconds);
      } catch {
        // Keep defaults if saved settings are invalid.
      } finally {
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          players: players.map(({ id, name }) => ({ id, name })),
          turnSeconds,
        }),
      );
    } catch {
      // Game remains usable when localStorage is unavailable.
    }
  }, [loaded, players, turnSeconds]);

  const resetPlayers = useCallback((durationMs: number) => {
    setPlayers((current) =>
      current.map((player) => ({ ...player, remainingMs: durationMs })),
    );
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      volume = 0.05,
      type: OscillatorType = "sine",
    ) => {
      if (!soundEnabled) return;

      try {
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;
        if (context.state === "suspended") void context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + duration,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
      } catch {
        // Browser audio may be unavailable or blocked.
      }
    },
    [soundEnabled],
  );

  const playTurnSound = useCallback(() => {
    playTone(440, 0.08, 0.04, "triangle");
  }, [playTone]);

  const playTimeoutSound = useCallback(() => {
    playTone(140, 0.18, 0.09, "sawtooth");
    window.setTimeout(() => playTone(110, 0.35, 0.11, "square"), 180);
  }, [playTone]);

  const getDurationMs = () => {
    const seconds = Number(turnSeconds);
    if (turnSeconds.trim() === "" || !Number.isInteger(seconds) || seconds < 0)
      return null;

    const milliseconds = seconds * 1000;
    return milliseconds > 0 ? milliseconds : null;
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index ? { ...player, name } : player,
      ),
    );
  };

  const addPlayer = () => {
    const durationMs = getDurationMs() ?? 60_000;
    setPlayers((current) => [
      ...current,
      {
        id: (current.at(-1)?.id ?? 0) + 1,
        name: `Người chơi ${current.length + 1}`,
        remainingMs: durationMs,
      },
    ]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;
    setRunning(false);
    setActiveIndex(null);
    setFinished(false);
    setPlayers((current) =>
      current.filter((_, playerIndex) => playerIndex !== index),
    );
  };

  const preparePlayers = () => {
    const durationMs = getDurationMs();
    if (!durationMs || players.some((player) => !player.name.trim()))
      return false;

    resetPlayers(durationMs);
    setActiveIndex(0);
    setRunning(false);
    setFinished(false);
    setVisualPulse(false);
    return true;
  };

  const startGame = () => {
    if (!preparePlayers()) return;
    playTurnSound();
    setRunning(true);
  };

  const toggleTimer = () => {
    if (finished) return;

    if (activeIndex === null) {
      if (preparePlayers()) setRunning(true);
      return;
    }

    setRunning((current) => {
      if (!current) playTurnSound();
      return !current;
    });
  };

  const switchPlayer = () => {
    if (activeIndex === null || finished) return;
    playTurnSound();
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % players.length,
    );
  };

  const nextPlayer = () => {
    if (activeIndex === null || finished) return;
    playTurnSound();
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % players.length,
    );
  };

  const resetGame = () => {
    const durationMs = getDurationMs();
    if (!durationMs) return;

    resetPlayers(durationMs);
    setActiveIndex(null);
    setRunning(false);
    setFinished(false);
    setVisualPulse(false);
  };

  const durationIsValid = getDurationMs() !== null;
  const losingPlayer =
    activeIndex !== null
      ? players.find((player) => player.remainingMs === 0)
      : undefined;

  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      if (tickingIntervalRef.current !== null) {
        window.clearInterval(tickingIntervalRef.current);
        tickingIntervalRef.current = null;
      }
      return;
    }

    tickingIntervalRef.current = window.setInterval(() => {
      playTone(780, 0.025, 0.018, "square");
    }, 1000);

    const interval = window.setInterval(() => {
      const now = performance.now();
      const previous = lastTickRef.current ?? now;
      const elapsed = now - previous;
      lastTickRef.current = now;

      setPlayers((current) => {
        if (activeIndex === null) return current;

        const next = [...current];
        const remainingMs = Math.max(
          0,
          next[activeIndex].remainingMs - elapsed,
        );
        next[activeIndex] = { ...next[activeIndex], remainingMs };

        if (remainingMs === 0) {
          window.clearInterval(interval);
          setRunning(false);
          setFinished(true);
          setVisualPulse(true);
          playTimeoutSound();
          window.setTimeout(() => setVisualPulse(false), 2400);
        }

        return next;
      });
    }, 50);

    return () => {
      window.clearInterval(interval);
      if (tickingIntervalRef.current !== null) {
        window.clearInterval(tickingIntervalRef.current);
        tickingIntervalRef.current = null;
      }
    };
  }, [running, activeIndex, playTimeoutSound, playTone]);

  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-6 sm:py-10 ${visualPulse ? "animate-pulse bg-rose-100" : "bg-[#f3f8ff]"}`}
    >
      <div className="mx-auto max-w-5xl">
        <BackToGamesButton />

        <header className="mb-6 rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Timer size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Đồng hồ lượt chơi
                </p>
                <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                  Chess Clock nhiều người
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Bật tắt âm thanh"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </header>

        {activeIndex === null ? (
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-black text-slate-900">
                Thiết lập thời gian
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Nhập tổng số giây cho mỗi người chơi. Không giới hạn số giây
                hoặc số người.
              </p>

              <div className="mt-4 max-w-xs">
                <label className="text-sm font-bold text-slate-600">
                  Giây
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={turnSeconds}
                    onChange={(event) => setTurnSeconds(event.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-black text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              {!durationIsValid && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  Nhập thời gian hợp lệ, lớn hơn 0 giây.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Người chơi
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Hiện có {players.length} người
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  Không giới hạn
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500">
                      {index + 1}
                    </div>
                    <input
                      value={player.name}
                      onChange={(event) =>
                        updatePlayerName(index, event.target.value)
                      }
                      maxLength={50}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        aria-label={`Xóa ${player.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPlayer}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-50"
              >
                <Plus size={17} />
                Thêm người chơi
              </button>
            </section>

            <button
              type="button"
              disabled={
                !durationIsValid ||
                players.some((player) => !player.name.trim())
              }
              onClick={startGame}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Play size={19} fill="white" />
              Bắt đầu đồng hồ
            </button>
          </div>
        ) : (
          <div
            className="space-y-5"
            onClick={() => {
              if (!finished) nextPlayer();
            }}
          >
            {finished && losingPlayer && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
                <p className="text-sm font-bold">Hết giờ</p>
                <p className="mt-1 text-xl font-black">{losingPlayer.name}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players.map((player, index) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    switchPlayer();
                  }}
                  disabled={!running && index !== activeIndex}
                  className={`relative min-h-36 rounded-3xl border-2 p-4 text-center transition sm:min-h-48 ${
                    finished && player.remainingMs === 0
                      ? "border-rose-500 bg-rose-600 text-white shadow-2xl shadow-rose-300"
                      : index === activeIndex
                        ? running
                          ? "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-200"
                          : "border-amber-400 bg-amber-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-wider opacity-70">
                    Người {index + 1}
                  </span>
                  <span className="mt-2 block truncate text-sm font-black sm:text-base">
                    {player.name}
                  </span>
                  <span className="mt-4 block font-mono text-3xl font-black tabular-nums sm:text-5xl">
                    {formatTime(player.remainingMs)}
                  </span>
                  {index === activeIndex && (
                    <span className="mt-3 block text-xs font-bold">
                      {running ? "Đang chạy" : "Tạm dừng"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div
              className="grid grid-cols-3 gap-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={toggleTimer}
                disabled={finished}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 font-black text-slate-700 disabled:opacity-40"
              >
                {running ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {running ? "Tạm dừng" : "Tiếp tục"}
              </button>

              <button
                type="button"
                onClick={nextPlayer}
                disabled={finished}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 font-black text-white disabled:opacity-40"
              >
                <SkipForward size={18} />
                Chuyển lượt
              </button>

              <button
                type="button"
                onClick={resetGame}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 font-black text-slate-700"
              >
                <RotateCcw size={18} />
                Đặt lại
              </button>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex(null);
                setRunning(false);
                setFinished(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-500"
            >
              <Minus size={16} />
              Quay lại thiết lập
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
