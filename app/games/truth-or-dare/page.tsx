"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import BackToGamesButton from "@/components/games/BackToGamesButton";

type GamePhase = "setup" | "playing";

type ChallengeType = "truth" | "dare";

const TRUTH_OR_DARE_STORAGE_KEY = "party-play-truth-or-dare-settings";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generatePrompt(keywords: string[]): string {
  if (keywords.length === 0) {
    return "";
  }

  return pickRandom(keywords);
}

function KeywordInput({
  title,
  description,
  keywords,
  onChange,
  accent,
}: {
  title: string;
  description: string;
  keywords: string[];
  onChange: (keywords: string[]) => void;
  accent: "pink" | "purple";
}) {
  const [input, setInput] = useState("");

  const colors =
    accent === "pink"
      ? {
          border: "border-pink-200",
          background: "bg-pink-50",
          text: "text-pink-700",
          button: "bg-pink-500 hover:bg-pink-600",
          focus: "focus:border-pink-400 focus:ring-pink-100",
        }
      : {
          border: "border-purple-200",
          background: "bg-purple-50",
          text: "text-purple-700",
          button: "bg-purple-500 hover:bg-purple-600",
          focus: "focus:border-purple-400 focus:ring-purple-100",
        };

  const addKeyword = () => {
    const value = input.trim();

    if (!value) return;

    const newKeywords = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const unique = newKeywords.filter(
      (item) =>
        !keywords.some(
          (existing) => existing.toLowerCase() === item.toLowerCase(),
        ),
    );

    onChange([...keywords, ...unique]);
    setInput("");
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((item) => item !== keyword));
  };

  return (
    <div className={`rounded-2xl border ${colors.border} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-bold ${colors.text}`}>{title}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.background} ${colors.text}`}
        >
          <Sparkles size={19} />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addKeyword();
            }
          }}
          placeholder="Nhập keyword..."
          className={`min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 transition ${colors.focus}`}
        />

        <button
          type="button"
          onClick={addKeyword}
          className={`flex shrink-0 items-center justify-center gap-1 rounded-xl px-3 text-white transition ${colors.button}`}
        >
          <Plus size={17} />
          <span className="hidden sm:inline">Thêm</span>
        </button>
      </div>

      <p className="mt-2 text-[11px] text-gray-400">
        Bạn cũng có thể nhập nhiều keyword cùng lúc, cách nhau bằng dấu phẩy.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className={`inline-flex items-center gap-1.5 rounded-full ${colors.background} px-3 py-1.5 text-sm ${colors.text}`}
          >
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="rounded-full opacity-60 transition hover:opacity-100"
              aria-label={`Xóa ${keyword}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {keywords.length === 0 && (
          <p className="text-sm italic text-gray-400">Chưa có keyword.</p>
        )}
      </div>

      {keywords.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${colors.text} hover:opacity-70`}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default function TruthOrDarePage() {
  const [phase, setPhase] = useState<GamePhase>("setup");

  const [players, setPlayers] = useState<string[]>([""]);

  const [truthKeywords, setTruthKeywords] = useState<string[]>([]);

  const [dareKeywords, setDareKeywords] = useState<string[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [playerPool, setPlayerPool] = useState<string[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [round, setRound] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(TRUTH_OR_DARE_STORAGE_KEY);

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (parsed && typeof parsed === "object") {
            const settings = parsed as Record<string, unknown>;

            if (
              isStringArray(settings.players) &&
              settings.players.length > 0
            ) {
              setPlayers(settings.players);
            }

            if (isStringArray(settings.truthKeywords)) {
              setTruthKeywords(settings.truthKeywords);
            }

            if (isStringArray(settings.dareKeywords)) {
              setDareKeywords(settings.dareKeywords);
            }
          }
        }
      } catch {
        // Keep the default settings if storage is unavailable or invalid.
      } finally {
        setSettingsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;

    try {
      window.localStorage.setItem(
        TRUTH_OR_DARE_STORAGE_KEY,
        JSON.stringify({ players, truthKeywords, dareKeywords }),
      );
    } catch {
      // The game still works if storage is unavailable.
    }
  }, [settingsLoaded, players, truthKeywords, dareKeywords]);

  const validPlayers = useMemo(
    () => players.map((name) => name.trim()).filter(Boolean),
    [players],
  );

  const currentPlayer = turnOrder[turnIndex] ?? "";

  const addPlayer = () => {
    setPlayers((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;

    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, value: string) => {
    setPlayers((prev) => prev.map((name, i) => (i === index ? value : name)));
  };

  const startGame = () => {
    if (!setupReady) {
      if (truthKeywords.length < 1 || dareKeywords.length < 1) {
        alert(
          "Hãy nhập ít nhất 1 keyword cho cả Truth và Dare trước khi bắt đầu!",
        );
      }
      return;
    }

    const names = validPlayers;

    if (names.length < 1) return;

    const uniqueNames = names.filter(
      (name, index) =>
        names.findIndex(
          (other) => other.toLowerCase() === name.toLowerCase(),
        ) === index,
    );

    if (uniqueNames.length < 1) {
      alert("Tên người chơi không được trùng nhau nhé!");
      return;
    }

    const shuffledPlayers = shuffle(uniqueNames);

    setPlayerPool(uniqueNames);
    setTurnOrder(shuffledPlayers);
    setTurnIndex(0);
    setRound(1);
    setCompletedCount(0);
    setSkippedCount(0);
    setSelectedType(null);
    setPrompt("");
    setPhase("playing");
  };

  const chooseType = (type: ChallengeType) => {
    const keywords = type === "truth" ? truthKeywords : dareKeywords;

    if (keywords.length < 1) {
      alert(
        `Hãy nhập ít nhất 1 keyword cho ${type.toUpperCase()} trước khi chọn!`,
      );
      return;
    }

    setSelectedType(type);
    setPrompt(generatePrompt(keywords));
  };

  const nextPlayer = () => {
    setSelectedType(null);
    setPrompt("");

    if (turnIndex >= turnOrder.length - 1) {
      const nextOrder = shuffle(playerPool);
      setTurnOrder(nextOrder);
      setTurnIndex(0);
      setRound((prev) => prev + 1);
    } else {
      setTurnIndex((prev) => prev + 1);
    }
  };

  const completeTurn = () => {
    setCompletedCount((prev) => prev + 1);
    nextPlayer();
  };

  const skipTurn = () => {
    setSkippedCount((prev) => prev + 1);
    nextPlayer();
  };

  const regeneratePrompt = () => {
    if (!selectedType) return;

    const keywords = selectedType === "truth" ? truthKeywords : dareKeywords;

    setPrompt(generatePrompt(keywords));
  };

  const resetGame = () => {
    setPhase("setup");
    setTurnOrder([]);
    setTurnIndex(0);
    setSelectedType(null);
    setPrompt("");
    setCompletedCount(0);
    setSkippedCount(0);
    setRound(1);
  };

  const setupReady =
    validPlayers.length >= 1 &&
    truthKeywords.length >= 1 &&
    dareKeywords.length >= 1;

  return (
    <main className="min-h-screen bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <BackToGamesButton
            label={phase === "playing" ? "Cài đặt game" : "Quay lại"}
            onClick={phase === "playing" ? resetGame : undefined}
          />

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-100">
              <Heart size={26} fill="white" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Truth or Dare
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Thật lòng hay thử thách?
              </p>
            </div>
          </div>
        </div>

        {phase === "setup" ? (
          <div className="space-y-5">
            {/* Players */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Người chơi</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Tối thiểu 1 người
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={19} />
                </div>
              </div>

              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500">
                      {index + 1}
                    </div>

                    <input
                      value={player}
                      onChange={(event) =>
                        updatePlayer(index, event.target.value)
                      }
                      placeholder={`Tên người chơi ${index + 1}`}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />

                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      disabled={players.length <= 1}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Xóa người chơi"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPlayer}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
              >
                <Plus size={17} />
                Thêm người chơi
              </button>
            </section>

            {/* Truth keywords */}
            <KeywordInput
              title="Truth keywords"
              description="Chủ đề bạn muốn xuất hiện trong câu hỏi Truth."
              keywords={truthKeywords}
              onChange={setTruthKeywords}
              accent="pink"
            />

            {/* Dare keywords */}
            <KeywordInput
              title="Dare keywords"
              description="Chủ đề bạn muốn xuất hiện trong các thử thách."
              keywords={dareKeywords}
              onChange={setDareKeywords}
              accent="purple"
            />

            {/* Start */}
            <button
              type="button"
              onClick={startGame}
              disabled={!setupReady}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 font-bold text-white shadow-lg shadow-purple-100 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={19} />
              Bắt đầu chơi
              <ArrowRight size={19} />
            </button>

            <p className="text-center text-xs text-gray-400">
              Keyword của bạn sẽ được dùng để tạo câu hỏi và thử thách.
            </p>

            {!setupReady && (
              <p className="text-center text-xs font-semibold text-amber-600">
                Cần nhập tên người chơi và ít nhất 1 keyword cho cả Truth lẫn
                Dare.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Game stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-400">Round</p>
                <p className="mt-1 text-xl font-black text-gray-900">{round}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-400">Completed</p>
                <p className="mt-1 text-xl font-black text-green-600">
                  {completedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-400">Skipped</p>
                <p className="mt-1 text-xl font-black text-gray-500">
                  {skippedCount}
                </p>
              </div>
            </div>

            {/* Current player */}
            <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-linear-to-r from-pink-500 to-purple-500 px-5 py-8 text-center text-white sm:py-10">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  <Shuffle size={13} />
                  Your turn
                </div>

                <h2 className="text-3xl font-black sm:text-4xl">
                  {currentPlayer}
                </h2>

                <p className="mt-2 text-sm text-white/80">
                  Chọn Truth hoặc Dare
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {!selectedType ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => chooseType("truth")}
                      className="group rounded-2xl border-2 border-pink-100 bg-pink-50 p-5 text-center transition hover:border-pink-300 hover:bg-pink-100 sm:p-7"
                    >
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-md shadow-pink-100 transition group-hover:scale-105">
                        <Heart size={25} />
                      </div>

                      <p className="text-xl font-black text-pink-600">TRUTH</p>

                      <p className="mt-1 text-xs text-pink-500">
                        Trả lời thật lòng
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseType("dare")}
                      className="group rounded-2xl border-2 border-purple-100 bg-purple-50 p-5 text-center transition hover:border-purple-300 hover:bg-purple-100 sm:p-7"
                    >
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-md shadow-purple-100 transition group-hover:scale-105">
                        <Zap size={25} fill="white" />
                      </div>

                      <p className="text-xl font-black text-purple-600">DARE</p>

                      <p className="mt-1 text-xs text-purple-500">
                        Thực hiện thử thách
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`rounded-2xl p-5 sm:p-7 ${
                        selectedType === "truth" ? "bg-pink-50" : "bg-purple-50"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            selectedType === "truth"
                              ? "bg-pink-100 text-pink-600"
                              : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {selectedType === "truth" ? (
                            <Heart size={14} />
                          ) : (
                            <Zap size={14} />
                          )}
                          {selectedType.toUpperCase()}
                        </div>

                        <button
                          type="button"
                          onClick={regeneratePrompt}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
                        >
                          <RotateCcw size={14} />
                          Đổi câu
                        </button>
                      </div>

                      <p
                        className={`text-center text-lg font-bold leading-8 sm:text-xl ${
                          selectedType === "truth"
                            ? "text-pink-900"
                            : "text-purple-900"
                        }`}
                      >
                        {prompt || "Hãy nhập keyword trong phần thiết lập."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={skipTurn}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        <X size={17} />
                        Skip
                      </button>

                      <button
                        type="button"
                        onClick={completeTurn}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white transition hover:bg-green-600"
                      >
                        <Check size={17} />
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Player order */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">
                  Player order
                </h3>
                <span className="text-xs text-gray-400">
                  {turnIndex + 1}/{turnOrder.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {turnOrder.map((player, index) => (
                  <div
                    key={`${player}-${index}`}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      index === turnIndex
                        ? "bg-purple-100 font-bold text-purple-700 ring-1 ring-purple-200"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {index === turnIndex && <span className="mr-1">▶</span>}
                    {player}
                  </div>
                ))}
              </div>
            </section>

            {/* Footer actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetGame}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RotateCcw size={17} />
                Chơi lại / Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
