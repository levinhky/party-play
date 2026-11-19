"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
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

type GamePhase = "setup" | "playing";

type ChallengeType = "truth" | "dare";

const DEFAULT_TRUTH_KEYWORDS = [];

const DEFAULT_DARE_KEYWORDS = [];

const TRUTH_TEMPLATES = [
  (keyword: string) =>
    `Tell us the most memorable story related to "${keyword}" in your life.`,
  (keyword: string) =>
    `What's something about "${keyword}" that you have never told this group?`,
  (keyword: string) =>
    `Have you ever had an awkward experience involving "${keyword}"? Tell us what happened.`,
  (keyword: string) => `What is your honest opinion about "${keyword}"?`,
  (keyword: string) =>
    `If you could change one thing about your experience with "${keyword}", what would it be?`,
  (keyword: string) =>
    `What's the first thing that comes to your mind when you hear "${keyword}"?`,
  (keyword: string) =>
    `What's the funniest thing you've experienced involving "${keyword}"?`,
  (keyword: string) =>
    `Would you rather experience "${keyword}" again or never experience it again? Why?`,
  (keyword: string) =>
    `Rate your experience with "${keyword}" from 1 to 10 and explain your score.`,
  (keyword: string) =>
    `What's one thing you would do differently regarding "${keyword}"?`,
];

const DARE_TEMPLATES = [
  (keyword: string) =>
    `Do your best impression of "${keyword}" for 20 seconds.`,
  (keyword: string) =>
    `Act out "${keyword}" without speaking. Let everyone guess.`,
  (keyword: string) =>
    `Create a short scene involving "${keyword}" and perform it for the group.`,
  (keyword: string) =>
    `Explain "${keyword}" as dramatically as possible, like you're in a movie.`,
  (keyword: string) =>
    `Make up a funny story involving "${keyword}" in 30 seconds.`,
  (keyword: string) =>
    `Describe "${keyword}" using only three words, then explain your choices.`,
  (keyword: string) =>
    `Pretend you're an expert on "${keyword}" and give a 20-second speech.`,
  (keyword: string) =>
    `Make a funny pose inspired by "${keyword}" and hold it for 10 seconds.`,
  (keyword: string) =>
    `Use "${keyword}" to create a ridiculous advertisement in 20 seconds.`,
  (keyword: string) => `Perform a mini talent show inspired by "${keyword}".`,
];

const EMPTY_TRUTH_TEMPLATES = [
  "What's something you wish more people knew about you?",
  "What's the most spontaneous thing you've ever done?",
  "What's a moment you still laugh about today?",
  "Who was the last person you thought about before sleeping?",
  "What's one thing you are secretly proud of?",
  "What is your biggest irrational fear?",
  "What's a small thing that can instantly make your day better?",
  "What's the weirdest thing you've ever done?",
  "If you could relive one day of your life, which day would it be?",
  "What's something you would like to try but haven't dared to?",
];

const EMPTY_DARE_TEMPLATES = [
  "Speak in an accent of your choice for the next two rounds.",
  "Do your best celebrity impression.",
  "Dance without music for 15 seconds.",
  "Sing the chorus of a song chosen by the group.",
  "Act like a robot for the next 30 seconds.",
  "Give everyone in the group a funny nickname.",
  "Tell a joke and try to make everyone laugh.",
  "Do a dramatic movie-style entrance.",
  "Make up a short rap about the person on your left.",
  "Pretend you're giving an award speech.",
];

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

function generatePrompt(type: ChallengeType, keywords: string[]): string {
  if (type === "truth") {
    if (keywords.length === 0) {
      return pickRandom(EMPTY_TRUTH_TEMPLATES);
    }

    const keyword = pickRandom(keywords);
    const template = pickRandom(TRUTH_TEMPLATES);

    return template(keyword);
  }

  if (keywords.length === 0) {
    return pickRandom(EMPTY_DARE_TEMPLATES);
  }

  const keyword = pickRandom(keywords);
  const template = pickRandom(DARE_TEMPLATES);

  return template(keyword);
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
          <p className="text-sm italic text-gray-400">
            Chưa có keyword. Game sẽ sử dụng câu hỏi mặc định.
          </p>
        )}
      </div>
    </div>
  );
}

export default function TruthOrDarePage() {
  const [phase, setPhase] = useState<GamePhase>("setup");

  const [players, setPlayers] = useState<string[]>(["", ""]);

  const [truthKeywords, setTruthKeywords] = useState<string[]>(
    DEFAULT_TRUTH_KEYWORDS,
  );

  const [dareKeywords, setDareKeywords] = useState<string[]>(
    DEFAULT_DARE_KEYWORDS,
  );

  const [playerPool, setPlayerPool] = useState<string[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);

  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);

  const [prompt, setPrompt] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [round, setRound] = useState(1);

  const [showPrompt, setShowPrompt] = useState(false);

  const validPlayers = useMemo(
    () => players.map((name) => name.trim()).filter(Boolean),
    [players],
  );

  const currentPlayer = turnOrder[turnIndex] ?? "";

  const addPlayer = () => {
    setPlayers((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;

    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, value: string) => {
    setPlayers((prev) => prev.map((name, i) => (i === index ? value : name)));
  };

  const startGame = () => {
    const names = validPlayers;

    if (names.length < 2) return;

    const uniqueNames = names.filter(
      (name, index) =>
        names.findIndex(
          (other) => other.toLowerCase() === name.toLowerCase(),
        ) === index,
    );

    if (uniqueNames.length < 2) {
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
    setShowPrompt(false);
    setPhase("playing");
  };

  const chooseType = (type: ChallengeType) => {
    setSelectedType(type);

    const keywords = type === "truth" ? truthKeywords : dareKeywords;

    setPrompt(generatePrompt(type, keywords));
    setShowPrompt(true);
  };

  const nextPlayer = () => {
    setSelectedType(null);
    setPrompt("");
    setShowPrompt(false);

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

    setPrompt(generatePrompt(selectedType, keywords));
  };

  const resetGame = () => {
    setPhase("setup");
    setTurnOrder([]);
    setTurnIndex(0);
    setSelectedType(null);
    setPrompt("");
    setShowPrompt(false);
    setCompletedCount(0);
    setSkippedCount(0);
    setRound(1);
  };

  return (
    <main className="min-h-screen bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => {
              if (phase === "playing") {
                resetGame();
              } else {
                window.history.back();
              }
            }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            {phase === "playing" ? "Cài đặt game" : "Quay lại"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-100">
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
                    Tối thiểu 2 người
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
                      disabled={players.length <= 2}
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
              disabled={validPlayers.length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 py-4 font-bold text-white shadow-lg shadow-purple-100 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={19} />
              Bắt đầu chơi
              <ArrowRight size={19} />
            </button>

            <p className="text-center text-xs text-gray-400">
              Keyword của bạn sẽ được dùng để tạo câu hỏi và thử thách.
            </p>
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
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-8 text-center text-white sm:py-10">
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
                        {prompt}
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
