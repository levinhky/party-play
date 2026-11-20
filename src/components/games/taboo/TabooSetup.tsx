"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  Pencil,
  X,
  Minus,
  ChevronDown as SelectChevronDown,
} from "lucide-react";
import BackToGamesButton from "@/components/games/BackToGamesButton";
import { tabooCards } from "@/data/tabooCards";
import type { TabooCardData, TabooSettings, TabooTeam } from "@/types/taboo";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface TabooSetupProps {
  onStart: (settings: TabooSettings) => void;
}

const teamColors = [
  "bg-blue-100 text-blue-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
];

const CUSTOM_CARDS_KEY = "party-play-taboo-custom-cards";
type DeckSource = "default" | "custom" | "combined";
type TimeMode = "preset" | "custom";

function isTabooCard(value: unknown): value is TabooCardData {
  if (!value || typeof value !== "object") return false;

  const card = value as Partial<TabooCardData>;

  return (
    typeof card.id === "string" &&
    typeof card.word === "string" &&
    typeof card.category === "string" &&
    ["easy", "medium", "hard"].includes(card.difficulty ?? "") &&
    Array.isArray(card.forbiddenWords) &&
    card.forbiddenWords.every((word) => typeof word === "string")
  );
}

function CardListCollapse({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 [&::-webkit-details-marker]:hidden [&_svg]:transition-transform [&[open]]:bg-slate-50 details[open]>&:bg-slate-50">
        <span>
          {title} · {count} thẻ
        </span>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className="shrink-0 text-slate-500 [[open]>summary>&]:rotate-180"
        />
      </summary>

      <div className="max-h-72 space-y-2 overflow-y-auto border-t border-slate-100 p-3">
        {children}
      </div>
    </details>
  );
}

export default function TabooSetup({ onStart }: TabooSetupProps) {
  const [playMode, setPlayMode] = useState<TabooSettings["mode"]>("individual");
  const [teamNames, setTeamNames] = useState(["Người chơi 1", "Người chơi 2"]);

  // Time configuration
  const [timeMode, setTimeMode] = useState<TimeMode>("preset");
  const [turnDuration, setTurnDuration] = useState<number>(60);
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("30");

  const [rounds, setRounds] = useState(1);
  const [customCards, setCustomCards] = useState<TabooCardData[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [deckSource, setDeckSource] = useState<DeckSource>("default");
  const [deckDistribution, setDeckDistribution] = useState<"shared" | "split">(
    "shared",
  );
  const [word, setWord] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [category, setCategory] = useState("Tự tạo");
  const [difficulty, setDifficulty] =
    useState<TabooCardData["difficulty"]>("medium");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [jsonImport, setJsonImport] = useState("");
  const [jsonImportStatus, setJsonImportStatus] = useState("");
  const [savingCards, setSavingCards] = useState(false);
  const [permanentUser, setPermanentUser] = useState<User | null>(null);

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

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user ?? null;
      setPermanentUser(user && !user.is_anonymous && user.email ? user : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setPermanentUser(user && !user.is_anonymous && user.email ? user : null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!permanentUser) return;

    let active = true;
    void supabase
      .from("taboo_custom_cards")
      .select("card")
      .order("updated_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!active) return;

        if (loadError) {
          setError(`Không tải được thẻ tài khoản: ${loadError.message}`);
          return;
        }

        const accountCards = (data ?? [])
          .map((row) => row.card)
          .filter(isTabooCard);
        if (accountCards.length > 0) {
          setCustomCards(accountCards);
        }
      });

    return () => {
      active = false;
    };
  }, [permanentUser]);

  function updateTeamName(index: number, value: string) {
    setTeamNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  }

  function addTeam() {
    if (teamNames.length >= (playMode === "individual" ? 20 : 10)) return;

    setTeamNames((current) => [
      ...current,
      playMode === "individual"
        ? `Người chơi ${current.length + 1}`
        : `Đội ${current.length + 1}`,
    ]);
  }

  function removeTeam(index: number) {
    if (teamNames.length <= 1) return;

    setTeamNames((current) => current.filter((_, i) => i !== index));
  }

  function changePlayMode(mode: TabooSettings["mode"]) {
    const previousMode = playMode;
    setPlayMode(mode);

    setTeamNames((current) =>
      current.slice(0, mode === "individual" ? 20 : 10).map((name, index) => {
        const oldDefault =
          previousMode === "individual"
            ? `Người chơi ${index + 1}`
            : `Đội ${index + 1}`;

        return name === oldDefault
          ? mode === "individual"
            ? `Người chơi ${index + 1}`
            : `Đội ${index + 1}`
          : name;
      }),
    );
  }

  function addCustomCard() {
    const cleanWord = word.trim();

    const cleanForbiddenWords = [
      ...new Set(
        forbiddenWords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

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

    if (
      cleanForbiddenWords.some(
        (item) =>
          item.toLocaleLowerCase("vi") === cleanWord.toLocaleLowerCase("vi"),
      )
    ) {
      setError("Từ khóa chính không thể đồng thời là từ cấm.");
      return;
    }

    if (
      customCards.some(
        (card) =>
          card.id !== editingCardId &&
          card.word.toLocaleLowerCase("vi") ===
            cleanWord.toLocaleLowerCase("vi"),
      )
    ) {
      setError("Từ khóa này đã có trong bộ thẻ tự tạo.");
      return;
    }

    const updatedCard: TabooCardData = {
      id:
        editingCardId ??
        `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      word: cleanWord,
      forbiddenWords: cleanForbiddenWords.slice(0, 6),
      category: category.trim() || "Tự tạo",
      difficulty,
    };

    const nextCards = editingCardId
      ? customCards.map((card) =>
          card.id === editingCardId ? updatedCard : card,
        )
      : [...customCards, updatedCard];

    setCustomCards(nextCards);
    void syncAccountCards(nextCards);

    if (!editingCardId) {
      setDeckSource((current) => (current === "default" ? "custom" : current));
    }

    setEditingCardId(null);
    setWord("");
    setForbiddenWords("");
    setCategory("Tự tạo");
    setDifficulty("medium");
    setError("");
  }

  function editCustomCard(card: TabooCardData) {
    setEditingCardId(card.id);
    setWord(card.word);
    setForbiddenWords(card.forbiddenWords.join(", "));
    setCategory(card.category);
    setDifficulty(card.difficulty);
    setError("");
  }

  function cancelEdit() {
    setEditingCardId(null);
    setWord("");
    setForbiddenWords("");
    setCategory("Tự tạo");
    setDifficulty("medium");
    setError("");
  }

  function removeCustomCard(id: string) {
    const nextCards = customCards.filter((card) => card.id !== id);
    setCustomCards(nextCards);
    void syncAccountCards(nextCards);

    if (editingCardId === id) {
      cancelEdit();
    }
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

    let finalTurnDuration = turnDuration;

    if (timeMode === "custom") {
      const minutes = Number(customMinutes);
      const seconds = Number(customSeconds);

      if (
        customMinutes.trim() === "" ||
        customSeconds.trim() === "" ||
        !Number.isInteger(minutes) ||
        !Number.isInteger(seconds) ||
        minutes < 0 ||
        seconds < 0 ||
        seconds > 59
      ) {
        setError("Thời gian tùy chỉnh không hợp lệ. Giây phải từ 0 đến 59.");
        return;
      }

      finalTurnDuration = minutes * 60 + seconds;

      if (finalTurnDuration <= 0) {
        setError("Thời gian mỗi lượt phải lớn hơn 0 giây.");
        return;
      }

      if (finalTurnDuration > 3600) {
        setError("Thời gian mỗi lượt không được vượt quá 60 phút.");
        return;
      }
    }

    const teams: TabooTeam[] = names.map((name, index) => ({
      id: `team-${index + 1}`,
      name,
      members: [],
      score: 0,
    }));

    const cards =
      deckSource === "default"
        ? tabooCards
        : deckSource === "custom"
          ? customCards
          : [...tabooCards, ...customCards];

    if (cards.length === 0) {
      setError("Hãy thêm ít nhất một thẻ từ khóa để bắt đầu.");
      return;
    }

    const teamCards: Record<string, TabooCardData[]> = {};

    for (const team of teams) {
      teamCards[team.id] = [];
    }

    if (deckDistribution === "split") {
      cards.forEach((card, index) => {
        const team = teams[index % teams.length];
        teamCards[team.id].push(card);
      });

      if (
        Object.values(teamCards).some(
          (assignedCards) => assignedCards.length === 0,
        )
      ) {
        setError("Cần ít nhất một thẻ cho mỗi người chơi hoặc đội.");
        return;
      }
    }

    setError("");

    onStart({
      mode: playMode,
      teams,
      turnDuration: finalTurnDuration,
      rounds,
      cards,
      deckDistribution,
      teamCards: deckDistribution === "split" ? teamCards : undefined,
    });
  }

  async function syncAccountCards(cards: TabooCardData[]) {
    if (!permanentUser) return;

    setSavingCards(true);

    try {
      await supabase
        .from("taboo_custom_cards")
        .delete()
        .eq("user_id", permanentUser.id);

      if (cards.length > 0) {
        const rows = cards.map((card) => ({
          user_id: permanentUser.id,
          card_id: card.id,
          card,
          updated_at: new Date().toISOString(),
        }));

        const { error: saveError } = await supabase
          .from("taboo_custom_cards")
          .insert(rows);

        if (saveError) throw saveError;
      }

      setJsonImportStatus(`Đã lưu ${cards.length} thẻ vào tài khoản.`);
    } catch (caught) {
      setJsonImportStatus(
        caught instanceof Error
          ? `Không lưu được thẻ tài khoản: ${caught.message}`
          : "Không lưu được thẻ tài khoản.",
      );
    } finally {
      setSavingCards(false);
    }
  }

  function importJsonCards() {
    try {
      const parsed: unknown = JSON.parse(jsonImport);
      const rawCards = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "cards" in parsed
          ? (parsed as { cards?: unknown }).cards
          : null;

      if (!Array.isArray(rawCards)) {
        setError("JSON phải là một mảng thẻ hoặc có trường cards là mảng.");
        return;
      }

      const imported: TabooCardData[] = [];

      for (const [index, rawCard] of rawCards.entries()) {
        if (!rawCard || typeof rawCard !== "object") {
          throw new Error(`Thẻ thứ ${index + 1} không hợp lệ.`);
        }

        const value = rawCard as Record<string, unknown>;
        const word = String(value.word ?? value.keyword ?? "").trim();
        const forbiddenWords = Array.isArray(value.forbiddenWords)
          ? [
              ...new Set(
                value.forbiddenWords
                  .map((item) => String(item).trim())
                  .filter(Boolean),
              ),
            ]
          : typeof value.forbiddenWords === "string"
            ? [
                ...new Set(
                  value.forbiddenWords
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                ),
              ]
            : [];
        const difficulty = value.difficulty;

        if (!word || forbiddenWords.length < 3 || forbiddenWords.length > 6) {
          throw new Error(
            `Thẻ thứ ${index + 1} cần keyword và 3–6 forbiddenWords.`,
          );
        }

        if (!["easy", "medium", "hard"].includes(String(difficulty))) {
          throw new Error(`Thẻ thứ ${index + 1} có difficulty không hợp lệ.`);
        }

        imported.push({
          id:
            typeof value.id === "string" && value.id.trim()
              ? value.id.trim()
              : `custom-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          word,
          forbiddenWords,
          category: String(value.category ?? "Tự tạo").trim() || "Tự tạo",
          difficulty: difficulty as TabooCardData["difficulty"],
        });
      }

      const merged = [...customCards];
      for (const card of imported) {
        if (
          !merged.some(
            (existing) =>
              existing.id === card.id ||
              existing.word.toLowerCase() === card.word.toLowerCase(),
          )
        ) {
          merged.push(card);
        }
      }

      setCustomCards(merged);
      setDeckSource((current) => (current === "default" ? "custom" : current));
      setJsonImportStatus(`Đã nhập ${imported.length} thẻ JSON.`);
      setJsonImport("");
      setError("");
      void syncAccountCards(merged);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "JSON thẻ không hợp lệ.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <BackToGamesButton />

        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <BookOpen size={21} />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            PARTY PLAY
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Thử thách Taboo
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Diễn tả từ khóa bằng tiếng Anh mà không được nói những từ cấm. Cùng
            đồng đội đoán thật nhanh để giành điểm!
          </p>
        </header>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {/* 1. Play mode */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  1. Chọn cách chơi
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Chơi cá nhân hoặc chia thành các đội.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {teamNames.length}/{playMode === "individual" ? 20 : 10}{" "}
                {playMode === "individual" ? "người" : "đội"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => changePlayMode("individual")}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  playMode === "individual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <span className="block font-bold text-slate-900">
                  Từng người
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Mỗi người tự ghi điểm
                </span>
              </button>

              <button
                type="button"
                onClick={() => changePlayMode("teams")}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  playMode === "teams"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <span className="block font-bold text-slate-900">Theo đội</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Có thể chơi với 1 đến 10 đội
                </span>
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
                    aria-label={
                      playMode === "individual"
                        ? `Tên người chơi ${index + 1}`
                        : `Tên đội ${index + 1}`
                    }
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder={
                      playMode === "individual"
                        ? `Tên người chơi ${index + 1}`
                        : `Tên đội ${index + 1}`
                    }
                  />

                  {teamNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeam(index)}
                      aria-label={`Xóa ${
                        playMode === "individual" ? "người chơi" : "đội"
                      } ${index + 1}`}
                      className="h-10 w-10 rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {teamNames.length < (playMode === "individual" ? 20 : 10) && (
              <button
                type="button"
                onClick={addTeam}
                className="mt-3 rounded-xl px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
              >
                + Thêm {playMode === "individual" ? "người chơi" : "đội"}
              </button>
            )}
          </section>

          {/* 2. Deck */}
          <section className="border-t border-slate-100 pt-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <BookOpen size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  2. Bộ từ khóa
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Dùng thẻ có sẵn, thẻ của bạn hoặc kết hợp cả hai.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["default", "Mặc định", `${tabooCards.length} thẻ có sẵn`],
                  ["custom", "Bộ của tôi", `${customCards.length} thẻ tự tạo`],
                  ["combined", "Kết hợp", "Dùng cả hai bộ"],
                ] as const
              ).map(([value, title, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeckSource(value)}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    deckSource === value
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <span className="block font-bold text-slate-900">
                    {title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {description}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeckDistribution("shared")}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  deckDistribution === "shared"
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <span className="block font-bold text-slate-900">
                  Bộ dùng chung
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Tất cả người chơi cùng dùng chung bộ thẻ.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeckDistribution("split")}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  deckDistribution === "split"
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <span className="block font-bold text-slate-900">
                  Chia bộ câu hỏi
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Mỗi người hoặc đội nhận thẻ riêng, không trùng lặp.
                </span>
              </button>
            </div>

            {deckSource === "default" && tabooCards.length > 0 && (
              <CardListCollapse title="Bộ mặc định" count={tabooCards.length}>
                {tabooCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {card.word}
                    </p>
                    <p className="text-xs text-slate-500">
                      {card.forbiddenWords.join(" · ")}
                    </p>
                  </div>
                ))}
              </CardListCollapse>
            )}

            {deckSource === "custom" && (
              <details className="group mt-5 rounded-2xl border border-slate-200 bg-slate-50/70">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 marker:hidden transition hover:bg-slate-100/70 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-bold text-slate-800">
                      Tạo / quản lý thẻ riêng
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {customCards.length} thẻ đã lưu · nội dung được ẩn khi
                      đang gập
                    </span>
                  </span>

                  <ChevronDown
                    size={19}
                    className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                  />
                </summary>

                <div className="border-t border-slate-200 p-4 sm:p-5">
                  <h3 className="font-bold text-slate-800">
                    {editingCardId ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Từ khóa cần diễn tả
                      <input
                        value={word}
                        onChange={(event) => setWord(event.target.value)}
                        maxLength={50}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Ví dụ: COFFEE"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      Chủ đề
                      <input
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        maxLength={24}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Ví dụ: Food"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                      Từ cấm (3–6 từ, cách nhau bằng dấu phẩy)
                      <input
                        value={forbiddenWords}
                        onChange={(event) =>
                          setForbiddenWords(event.target.value)
                        }
                        maxLength={180}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        placeholder="Ví dụ: drink, hot, bean, cup, morning"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      Độ khó
                      <span className="relative mt-1.5 block">
                        <select
                          value={difficulty}
                          onChange={(event) =>
                            setDifficulty(
                              event.target.value as TabooCardData["difficulty"],
                            )
                          }
                          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm font-normal text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="easy">Dễ</option>
                          <option value="medium">Trung bình</option>
                          <option value="hard">Khó</option>
                        </select>

                        <SelectChevronDown
                          aria-hidden="true"
                          size={16}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                      </span>
                    </label>

                    <div className="mt-4 flex items-center gap-2 self-end">
                      {editingCardId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          <X size={16} /> Hủy
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={addCustomCard}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        {editingCardId ? (
                          <>
                            <Pencil size={16} /> Lưu thay đổi
                          </>
                        ) : (
                          <>
                            <Plus size={17} /> Thêm thẻ
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {customCards.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Bộ tự tạo · {customCards.length} thẻ
                      </p>

                      <CardListCollapse
                        title="Bộ tự tạo"
                        count={customCards.length}
                      >
                        {customCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {card.word}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {card.forbiddenWords.join(" · ")}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => editCustomCard(card)}
                                aria-label={`Sửa thẻ ${card.word}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeCustomCard(card.id)}
                                aria-label={`Xóa thẻ ${card.word}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </CardListCollapse>
                    </div>
                  )}

                  {cardsLoaded && customCards.length === 0 && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles size={14} className="text-blue-500" />
                      Thẻ tự tạo được lưu trên thiết bị này cho lần chơi sau.
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* JSON import section */}
            {deckSource === "custom" && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-900">
                      Nhập nhanh bằng JSON
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Nhận mảng thẻ hoặc object {'{ "cards": [...] }'}.
                    </p>
                  </div>
                  {savingCards && (
                    <span className="text-xs font-bold text-blue-700">
                      Đang lưu...
                    </span>
                  )}
                </div>

                <textarea
                  value={jsonImport}
                  onChange={(event) => setJsonImport(event.target.value)}
                  rows={7}
                  spellCheck={false}
                  className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-3 py-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder={
                    '[{"id":"coffee","keyword":"COFFEE","forbiddenWords":["drink","hot","bean","cup","morning"],"category":"Thức uống","difficulty":"easy"}]'
                  }
                />

                {jsonImportStatus && (
                  <p className="mt-2 text-xs font-semibold text-blue-700">
                    {jsonImportStatus}
                  </p>
                )}

                <button
                  type="button"
                  disabled={savingCards || !jsonImport.trim()}
                  onClick={importJsonCards}
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Nhập danh sách JSON
                </button>
              </div>
            )}
          </section>

          {/* 3. Turn duration */}
          <section className="border-t border-slate-100 pt-7">
            <h2 className="text-lg font-bold text-slate-900">
              3. Thời gian mỗi lượt
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chọn thời gian có sẵn hoặc tự thiết lập phút và giây.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[30, 60, 90].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => {
                    setTimeMode("preset");
                    setTurnDuration(seconds);
                    setError("");
                  }}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    timeMode === "preset" && turnDuration === seconds
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200"
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

              <button
                type="button"
                onClick={() => {
                  setTimeMode("custom");
                  setError("");
                }}
                className={`rounded-2xl border-2 p-4 text-center transition ${
                  timeMode === "custom"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <span className="block text-lg font-black text-slate-900">
                  Tùy chỉnh
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  phút / giây
                </span>
              </button>
            </div>

            {timeMode === "custom" && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Nhập thời gian cho mỗi lượt
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-slate-600">
                    Phút
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={1}
                      value={customMinutes}
                      onChange={(event) => {
                        setCustomMinutes(event.target.value);
                        setError("");
                      }}
                      className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="0"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-600">
                    Giây
                    <input
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      value={customSeconds}
                      onChange={(event) => {
                        setCustomSeconds(event.target.value);
                        setError("");
                      }}
                      className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="0–59"
                    />
                  </label>
                </div>

                <div className="mt-3 rounded-xl bg-white px-4 py-3 text-center">
                  <p className="text-xs font-medium text-slate-500">
                    Thời gian đã thiết lập
                  </p>

                  <p className="mt-1 text-xl font-black text-blue-700">
                    {Math.max(0, Number(customMinutes) || 0)} phút{" "}
                    {Math.max(0, Number(customSeconds) || 0)} giây
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ={" "}
                    {Math.max(0, Number(customMinutes) || 0) * 60 +
                      Math.max(0, Number(customSeconds) || 0)}{" "}
                    giây
                  </p>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Thời gian tối đa là 60 phút. Giây nhập từ 0 đến 59.
                </p>
              </div>
            )}
          </section>

          {/* 4. Rounds */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">
              4. Số vòng chơi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mỗi vòng, mỗi {playMode === "individual" ? "người chơi" : "đội"}{" "}
              có một lượt diễn tả.
            </p>

            <div className="mt-4 inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => setRounds((current) => Math.max(1, current - 1))}
                disabled={rounds <= 1}
                aria-label="Giảm số vòng"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={18} />
              </button>

              <span className="min-w-24 text-center">
                <strong className="block text-2xl font-black text-slate-900">
                  {rounds}
                </strong>
                <span className="text-xs font-semibold text-slate-500">
                  vòng
                </span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setRounds((current) => Math.min(20, current + 1))
                }
                disabled={rounds >= 20}
                aria-label="Tăng số vòng"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>
          </section>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {/* Start */}
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            Bắt đầu trò chơi →
          </button>

          {/* Room entry link */}
          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-center">
            <p className="text-sm mb-2 font-bold text-slate-500">
              Hoặc tham gia phòng chơi trực tuyến:
            </p>

            <Link
              href="/games/taboo/online"
              className="mb-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-left transition hover:border-blue-300 hover:bg-blue-100"
            >
              <span>
                <span className="block font-bold text-blue-900">
                  Chơi trực tuyến
                </span>
                <span className="mt-1 block text-xs text-blue-700">
                  Tạo phòng cho quản trò và người chơi trên máy riêng.
                </span>
              </span>
              <span className="text-xl font-black text-blue-700">→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
