"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Plus, Trash2 } from "lucide-react";
import BackToGamesButton from "@/components/games/BackToGamesButton";
import type {
  MemoryDifficulty,
  MemoryMode,
  MemoryCardData,
  MemoryVocabularySource,
  MemorySettings,
} from "@/types/memory";
import { memoryVocabularyCards } from "@/data/memoryCards";

const CUSTOM_VOCABULARY_KEY = "party-play-memory-custom-vocabulary";

function isVocabularyCard(value: unknown): value is MemoryCardData {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<MemoryCardData>;
  return (
    typeof card.id === "string" &&
    typeof card.pairId === "string" &&
    typeof card.content === "string" &&
    typeof card.matchContent === "string" &&
    card.type === "vocabulary"
  );
}

interface MemorySetupProps {
  onStart: (settings: MemorySettings) => void;
}

const difficultyOptions: {
  value: MemoryDifficulty;
  label: string;
  description: string;
  pairs: number;
}[] = [
  {
    value: "easy",
    label: "Dễ",
    description: "Phù hợp để khởi động",
    pairs: 6,
  },
  {
    value: "medium",
    label: "Trung bình",
    description: "Cần ghi nhớ tốt hơn",
    pairs: 10,
  },
  {
    value: "hard",
    label: "Khó",
    description: "Thử thách trí nhớ",
    pairs: 15,
  },
];

export default function MemorySetup({ onStart }: MemorySetupProps) {
  const [playerNames, setPlayerNames] = useState([
    "Người chơi 1",
    "Người chơi 2",
  ]);
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("easy");
  const [mode, setMode] = useState<MemoryMode>("icons");
  const [vocabularySource, setVocabularySource] =
    useState<MemoryVocabularySource>("default");
  const [customVocabulary, setCustomVocabulary] = useState<MemoryCardData[]>(
    [],
  );
  const [vocabularyLoaded, setVocabularyLoaded] = useState(false);
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(CUSTOM_VOCABULARY_KEY);
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        setCustomVocabulary(
          Array.isArray(parsed) ? parsed.filter(isVocabularyCard) : [],
        );
      } catch {
        setCustomVocabulary([]);
      } finally {
        setVocabularyLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!vocabularyLoaded) return;
    try {
      localStorage.setItem(
        CUSTOM_VOCABULARY_KEY,
        JSON.stringify(customVocabulary),
      );
    } catch {
      // Keep the custom list available during this setup session.
    }
  }, [customVocabulary, vocabularyLoaded]);

  function updatePlayerName(index: number, value: string) {
    setPlayerNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  }

  function addPlayer() {
    if (playerNames.length >= 8) return;

    setPlayerNames((current) => [
      ...current,
      `Người chơi ${current.length + 1}`,
    ]);
  }

  function removePlayer(index: number) {
    if (playerNames.length <= 1) return;

    setPlayerNames((current) => current.filter((_, i) => i !== index));
  }

  function addVocabulary() {
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    if (!cleanWord || !cleanMeaning) {
      setError("Hãy nhập cả từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }
    if (
      [...memoryVocabularyCards, ...customVocabulary].some(
        (card) =>
          card.content.toLocaleLowerCase("vi") ===
          cleanWord.toLocaleLowerCase("vi"),
      )
    ) {
      setError("Từ tiếng Anh này đã có trong bộ từ vựng.");
      return;
    }
    const id = `custom-vocab-${Date.now()}`;
    setCustomVocabulary((current) => [
      ...current,
      {
        id,
        pairId: id,
        content: cleanWord,
        matchContent: cleanMeaning,
        type: "vocabulary",
      },
    ]);
    setVocabularySource((current) =>
      current === "default" ? "custom" : current,
    );
    setWord("");
    setMeaning("");
    setError("");
  }

  function handleStart() {
    const names = playerNames.map((name) => name.trim());

    if (names.some((name) => !name)) {
      setError("Vui lòng nhập tên cho tất cả người chơi.");
      return;
    }

    const normalizedNames = names.map((name) => name.toLocaleLowerCase("vi"));

    if (new Set(normalizedNames).size !== names.length) {
      setError("Tên người chơi không được trùng nhau.");
      return;
    }

    if (
      mode === "vocabulary" &&
      vocabularySource === "custom" &&
      customVocabulary.length < 2
    ) {
      setError("Bộ từ tự tạo cần ít nhất 2 cặp từ để chơi.");
      return;
    }

    setError("");

    onStart({
      playerNames: names,
      difficulty,
      mode,
      vocabularySource,
      customVocabulary,
    });
  }

  const selectedVocabulary =
    vocabularySource === "custom"
      ? customVocabulary
      : vocabularySource === "combined"
        ? [...memoryVocabularyCards, ...customVocabulary]
        : memoryVocabularyCards;
  const availablePairs = mode === "icons" ? 16 : selectedVocabulary.length;

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <BackToGamesButton />
        {/* Tiêu đề */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
            🧠
          </div>

          <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
            TRÒ CHƠI GHI NHỚ
          </span>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Lật thẻ ghi nhớ
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
            Lật các thẻ, ghi nhớ vị trí và tìm những cặp giống nhau. Rủ bạn bè
            cùng chơi để xem ai có trí nhớ tốt nhất!
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {/* Chọn chế độ */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">
              1. Chọn chế độ chơi
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ModeCard
                selected={mode === "icons"}
                onClick={() => setMode("icons")}
                icon="🎨"
                title="Ghép biểu tượng"
                description="Tìm hai thẻ có cùng biểu tượng."
              />

              <ModeCard
                selected={mode === "vocabulary"}
                onClick={() => setMode("vocabulary")}
                icon="🇬🇧"
                title="Học từ vựng"
                description="Ghép từ tiếng Anh với nghĩa tiếng Việt."
              />
            </div>
          </section>

          {mode === "vocabulary" && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <BookOpen size={19} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Bộ từ vựng</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn bộ có sẵn, bộ riêng hoặc trộn hai bộ.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    [
                      "default",
                      "Mặc định",
                      `${memoryVocabularyCards.length} cặp`,
                    ],
                    ["custom", "Bộ của tôi", `${customVocabulary.length} cặp`],
                    ["combined", "Kết hợp", "Mặc định + từ riêng"],
                  ] as const
                ).map(([value, title, detail]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVocabularySource(value)}
                    className={`rounded-xl border-2 p-3 text-left transition ${vocabularySource === value ? "border-blue-500 bg-white" : "border-white bg-white/50 hover:border-blue-200"}`}
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {detail}
                    </span>
                  </button>
                ))}
              </div>

              <details className="group mt-4 rounded-xl border border-blue-100 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 transition hover:bg-blue-50 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      Tạo / quản lý từ vựng riêng
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {customVocabulary.length} cặp đã lưu
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-slate-500 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-blue-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="text-xs font-semibold text-slate-600">
                      Từ tiếng Anh
                      <input
                        value={word}
                        onChange={(event) => setWord(event.target.value)}
                        maxLength={40}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Ví dụ: Butterfly"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Nghĩa tiếng Việt
                      <input
                        value={meaning}
                        onChange={(event) => setMeaning(event.target.value)}
                        maxLength={50}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Ví dụ: Con bướm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addVocabulary}
                      className="mt-4 inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700"
                    >
                      <Plus size={17} /> Thêm cặp
                    </button>
                  </div>
                  {customVocabulary.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {customVocabulary.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {card.content}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {card.matchContent}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Xóa từ ${card.content}`}
                            onClick={() =>
                              setCustomVocabulary((current) =>
                                current.filter((item) => item.id !== card.id),
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {vocabularyLoaded && customVocabulary.length === 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Bộ từ riêng được lưu trên thiết bị này cho lần chơi sau.
                    </p>
                  )}
                </div>
              </details>
            </section>
          )}

          {/* Độ khó */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Chọn độ khó</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={`
                  rounded-2xl border-2 p-4 text-left transition
                  ${
                    difficulty === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200"
                  }
                `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {option.label}
                    </span>

                    {difficulty === option.value && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {option.description}
                  </p>

                  <p className="mt-3 text-sm font-bold text-blue-600">
                    {Math.min(option.pairs, availablePairs)} cặp ·{" "}
                    {Math.min(option.pairs, availablePairs) * 2} thẻ
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Người chơi */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  3. Người chơi
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Có thể chơi một mình hoặc cùng tối đa 8 người.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {playerNames.length}/8
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                    {index + 1}
                  </div>

                  <input
                    type="text"
                    value={name}
                    maxLength={24}
                    onChange={(event) =>
                      updatePlayerName(index, event.target.value)
                    }
                    placeholder={`Tên người chơi ${index + 1}`}
                    aria-label={`Tên người chơi ${index + 1}`}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  {playerNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      aria-label={`Xóa người chơi ${index + 1}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {playerNames.length < 8 && (
              <button
                type="button"
                onClick={addPlayer}
                className="mt-3 rounded-xl px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
              >
                + Thêm người chơi
              </button>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Bắt đầu */}
          <button
            type="button"
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            Bắt đầu trò chơi
            <span aria-hidden="true">→</span>
          </button>

          <p className="text-center text-xs leading-5 text-slate-400">
            Mẹo: Hãy ghi nhớ vị trí từng thẻ để tăng cơ hội tìm được cặp đúng.
          </p>
        </div>
      </div>
    </main>
  );
}

function ModeCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition
        ${
          selected
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-blue-200"
        }
      `}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-bold text-slate-900">
          {title}
          {selected && <span className="text-sm text-blue-600">✓</span>}
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}
