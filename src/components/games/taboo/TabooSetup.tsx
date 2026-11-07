"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Trash2, Sparkles, ChevronDown } from "lucide-react";
import { tabooCards } from "@/data/tabooCards";
import type { TabooCardData, TabooSettings, TabooTeam } from "@/types/taboo";

interface TabooSetupProps {
  onStart: (settings: TabooSettings) => void;
}

const teamColors = [
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
];

const CUSTOM_CARDS_KEY = "party-play-taboo-custom-cards";
type DeckSource = "default" | "custom" | "combined";

function isTabooCard(value: unknown): value is TabooCardData {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<TabooCardData>;
  return typeof card.id === "string"
    && typeof card.word === "string"
    && typeof card.category === "string"
    && ["easy", "medium", "hard"].includes(card.difficulty ?? "")
    && Array.isArray(card.forbiddenWords)
    && card.forbiddenWords.every((word) => typeof word === "string");
}

export default function TabooSetup({ onStart }: TabooSetupProps) {
  const [playMode, setPlayMode] = useState<TabooSettings["mode"]>("individual");
  const [teamNames, setTeamNames] = useState(["Người chơi 1", "Người chơi 2"]);
  const [turnDuration, setTurnDuration] = useState<30 | 60 | 90>(60);
  const [rounds, setRounds] = useState(3);
  const [customCards, setCustomCards] = useState<TabooCardData[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [deckSource, setDeckSource] = useState<DeckSource>("default");
  const [word, setWord] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [category, setCategory] = useState("Tự tạo");
  const [difficulty, setDifficulty] = useState<TabooCardData["difficulty"]>("medium");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(CUSTOM_CARDS_KEY);
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        setCustomCards(Array.isArray(parsed) ? parsed.filter(isTabooCard) : []);
      } catch {
        setCustomCards([]);
      } finally {
        setCardsLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cardsLoaded) return;
    try {
      localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(customCards));
    } catch {
      // Keep the current custom deck available for this game.
    }
  }, [cardsLoaded, customCards]);

  function updateTeamName(index: number, value: string) {
    setTeamNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  }

  function addTeam() {
    if (teamNames.length >= (playMode === "individual" ? 8 : 4)) return;

    setTeamNames((current) => [
      ...current,
      playMode === "individual" ? `Người chơi ${current.length + 1}` : `Đội ${current.length + 1}`,
    ]);
  }

  function removeTeam(index: number) {
    if (teamNames.length <= 1) return;

    setTeamNames((current) =>
      current.filter((_, i) => i !== index),
    );
  }

  function changePlayMode(mode: TabooSettings["mode"]) {
    const previousMode = playMode;
    setPlayMode(mode);
    setTeamNames((current) => current.slice(0, mode === "individual" ? 8 : 4).map((name, index) => {
      const oldDefault = previousMode === "individual" ? `Người chơi ${index + 1}` : `Đội ${index + 1}`;
      return name === oldDefault
        ? mode === "individual" ? `Người chơi ${index + 1}` : `Đội ${index + 1}`
        : name;
    }));
  }

  function addCustomCard() {
    const cleanWord = word.trim();
    const cleanForbiddenWords = [...new Set(forbiddenWords.split(",").map((item) => item.trim()).filter(Boolean))];
    if (!cleanWord) {
      setError("Hãy nhập từ khóa cần diễn tả.");
      return;
    }
    if (cleanForbiddenWords.length < 3) {
      setError("Mỗi thẻ cần ít nhất 3 từ cấm, ngăn cách bằng dấu phẩy.");
      return;
    }
    if (cleanForbiddenWords.length > 6) {
      setError("Mỗi thẻ tối đa 6 từ cấm.");
      return;
    }
    if (cleanForbiddenWords.some((item) => item.toLocaleLowerCase("vi") === cleanWord.toLocaleLowerCase("vi"))) {
      setError("Từ khóa chính không thể đồng thời là từ cấm.");
      return;
    }
    if (customCards.some((card) => card.word.toLocaleLowerCase("vi") === cleanWord.toLocaleLowerCase("vi"))) {
      setError("Từ khóa này đã có trong bộ thẻ tự tạo.");
      return;
    }
    setCustomCards((current) => [...current, {
      id: `custom-${Date.now()}`,
      word: cleanWord,
      forbiddenWords: cleanForbiddenWords.slice(0, 6),
      category: category.trim() || "Tự tạo",
      difficulty,
    }]);
    setDeckSource((current) => current === "default" ? "custom" : current);
    setWord("");
    setForbiddenWords("");
    setError("");
  }

  function removeCustomCard(id: string) {
    setCustomCards((current) => current.filter((card) => card.id !== id));
  }

  function handleStart() {
    const names = teamNames.map((name) => name.trim());

    if (names.some((name) => !name)) {
      setError("Vui lòng nhập tên cho tất cả các đội.");
      return;
    }

    if (
      new Set(names.map((name) => name.toLocaleLowerCase("vi"))).size !==
      names.length
    ) {
      setError("Tên các đội không được trùng nhau.");
      return;
    }

    const teams: TabooTeam[] = names.map((name, index) => ({
      id: `team-${index + 1}`,
      name,
      members: [],
      score: 0,
    }));

    const cards = deckSource === "default"
      ? tabooCards
      : deckSource === "custom"
        ? customCards
        : [...tabooCards, ...customCards];
    if (cards.length === 0) {
      setError("Hãy thêm ít nhất một thẻ từ khóa để bắt đầu.");
      return;
    }

    setError("");
    onStart({
      mode: playMode,
      teams,
      turnDuration,
      rounds,
      cards,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/games" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-violet-200 hover:text-violet-700">
          <ArrowLeft size={17} /> Quay lại
        </Link>
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-3xl">
            🗣️
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            PARTY PLAY
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Thử thách Taboo
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Diễn tả từ khóa bằng tiếng Anh mà không được nói những từ cấm.
            Cùng đồng đội đoán thật nhanh để giành điểm!
          </p>
        </header>

        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">1. Chọn cách chơi</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Chơi cá nhân hoặc chia thành các đội.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {teamNames.length}/{playMode === "individual" ? 8 : 4} {playMode === "individual" ? "người" : "đội"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => changePlayMode("individual")}
                className={`rounded-2xl border-2 p-4 text-left transition ${playMode === "individual" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}
              >
                <span className="block font-bold text-slate-900">Từng người</span>
                <span className="mt-1 block text-xs text-slate-500">Mỗi người tự ghi điểm</span>
              </button>
              <button
                type="button"
                onClick={() => changePlayMode("teams")}
                className={`rounded-2xl border-2 p-4 text-left transition ${playMode === "teams" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}
              >
                <span className="block font-bold text-slate-900">Theo đội</span>
                <span className="mt-1 block text-xs text-slate-500">Có thể chơi với 1 đến 4 đội</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {teamNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
                      teamColors[index % teamColors.length]
                    }`}
                  >
                    {index + 1}
                  </div>

                  <input
                    value={name}
                    onChange={(event) =>
                      updateTeamName(index, event.target.value)
                    }
                    maxLength={30}
                    aria-label={playMode === "individual" ? `Tên người chơi ${index + 1}` : `Tên đội ${index + 1}`}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    placeholder={playMode === "individual" ? `Tên người chơi ${index + 1}` : `Tên đội ${index + 1}`}
                  />

                  {teamNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeam(index)}
                      aria-label={`Xóa ${playMode === "individual" ? "người chơi" : "đội"} ${index + 1}`}
                      className="h-10 w-10 rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {teamNames.length < (playMode === "individual" ? 8 : 4) && (
              <button
                type="button"
                onClick={addTeam}
                className="mt-3 rounded-xl px-3 py-2 text-sm font-bold text-violet-600 transition hover:bg-violet-50"
              >
                + Thêm {playMode === "individual" ? "người chơi" : "đội"}
              </button>
            )}
          </section>

          <section className="border-t border-slate-100 pt-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <BookOpen size={21} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. Bộ từ khóa</h2>
                <p className="mt-1 text-sm text-slate-500">Dùng thẻ có sẵn, thẻ của bạn hoặc kết hợp cả hai.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([
                ["default", "Mặc định", `${tabooCards.length} thẻ có sẵn`],
                ["custom", "Bộ của tôi", `${customCards.length} thẻ tự tạo`],
                ["combined", "Kết hợp", "Dùng cả hai bộ"],
              ] as const).map(([value, title, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeckSource(value)}
                  className={`rounded-2xl border-2 p-4 text-left transition ${deckSource === value ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}
                >
                  <span className="block font-bold text-slate-900">{title}</span>
                  <span className="mt-1 block text-xs text-slate-500">{description}</span>
                </button>
              ))}
            </div>

            <details className="group mt-5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 marker:hidden transition hover:bg-slate-100/70 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block font-bold text-slate-800">Tạo / quản lý thẻ riêng</span>
                  <span className="mt-1 block text-xs text-slate-500">{customCards.length} thẻ đã lưu · nội dung được ẩn khi đang gập</span>
                </span>
                <ChevronDown size={19} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-800">Tạo thẻ mới</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Từ khóa cần diễn tả
                  <input value={word} onChange={(event) => setWord(event.target.value)} maxLength={50} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Ví dụ: COFFEE" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Chủ đề
                  <input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={24} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Ví dụ: Food" />
                </label>
                <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                  Từ cấm (3–6 từ, cách nhau bằng dấu phẩy)
                  <input value={forbiddenWords} onChange={(event) => setForbiddenWords(event.target.value)} maxLength={180} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Ví dụ: drink, hot, bean, cup, morning" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Độ khó
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as TabooCardData["difficulty"])} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </label>
                <button type="button" onClick={addCustomCard} className="mt-4 inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700">
                  <Plus size={17} /> Thêm thẻ
                </button>
              </div>

              {customCards.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bộ tự tạo · {customCards.length} thẻ</p>
                  {customCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{card.word}</p>
                        <p className="truncate text-xs text-slate-500">{card.forbiddenWords.join(" · ")}</p>
                      </div>
                      <button type="button" onClick={() => removeCustomCard(card.id)} aria-label={`Xóa thẻ ${card.word}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {cardsLoaded && customCards.length === 0 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Sparkles size={14} className="text-orange-500" />Thẻ tự tạo được lưu trên thiết bị này cho lần chơi sau.</p>
              )}
              </div>
            </details>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">
              3. Thời gian mỗi lượt
            </h2>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {([30, 60, 90] as const).map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setTurnDuration(seconds)}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    turnDuration === seconds
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-violet-200"
                  }`}
                >
                  <span className="block text-2xl font-black text-slate-900">
                    {seconds}
                  </span>

                  <span className="mt-1 block text-sm text-slate-500">
                    giây
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">
              4. Số vòng chơi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mỗi vòng, mỗi {playMode === "individual" ? "người chơi" : "đội"} có một lượt diễn tả.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setRounds(count)}
                  className={`min-w-16 rounded-xl border-2 px-5 py-3 font-bold transition ${
                    rounds === count
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 text-slate-600 hover:border-violet-200"
                  }`}
                >
                  {count} vòng
                </button>
              ))}
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.99]"
          >
            Bắt đầu trò chơi →
          </button>
        </div>
      </div>
    </main>
  );
}
