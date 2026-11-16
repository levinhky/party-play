"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  Settings2,
  Shuffle,
  Sparkles,
  Users,
  Pencil,
  Trash2,
  BookOpen,
  Save,
  X,
  Library,
  Check,
  ChevronDown,
} from "lucide-react";

import { spyCategories, spyWordPairs } from "@/data/spyWords";
import type { SpySettings, SpyWordPair, SpyWordSource } from "@/types/spy";

interface SpySetupProps {
  onStart: (settings: SpySettings) => void;
}

const DEFAULT_NAMES = [
  "Người chơi 1",
  "Người chơi 2",
  "Người chơi 3",
  "Người chơi 4",
];

const STORAGE_KEY = "party-play-spy-custom-words";

const EMPTY_WORD: Omit<SpyWordPair, "id"> = {
  category: "Đồ ăn",
  word: "",
  spyWord: "",
};

export default function SpySetup({ onStart }: SpySetupProps) {
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES);
  const [spyCount, setSpyCount] = useState(1);
  const [mode, setMode] = useState<SpySettings["mode"]>("different-word");

  const [category, setCategory] = useState("Tất cả chủ đề");
  const [discussionMinutes, setDiscussionMinutes] = useState(5);

  const [wordSource, setWordSource] = useState<SpyWordSource>("default");

  const [customWordPairs, setCustomWordPairs] = useState<SpyWordPair[]>([]);

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const [nameError, setNameError] = useState("");
  const [wordError, setWordError] = useState("");

  // Mặc định thu gọn phần quản lý từ khóa.
  const [isCustomWordsExpanded, setIsCustomWordsExpanded] = useState(false);

  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);

  const [wordForm, setWordForm] = useState(EMPTY_WORD);

  const validNames = playerNames.filter((name) => name.trim().length > 0);

  const maxSpies = Math.max(1, Math.floor(validNames.length / 3));

  const availableCategories = useMemo(() => {
    const customCategories = customWordPairs.map((pair) => pair.category);

    return [...new Set([...spyCategories, ...customCategories])];
  }, [customWordPairs]);

  const filteredCustomWords = useMemo(() => {
    if (category === "Tất cả chủ đề") {
      return customWordPairs;
    }

    return customWordPairs.filter((pair) => pair.category === category);
  }, [customWordPairs, category]);

  const filteredDefaultWords = useMemo(() => {
    if (category === "Tất cả chủ đề") {
      return spyWordPairs;
    }

    return spyWordPairs.filter((pair) => pair.category === category);
  }, [category]);

  const availableCustomWords =
    wordSource === "custom"
      ? filteredCustomWords
      : wordSource === "all"
        ? filteredCustomWords
        : [];

  const selectedWordCount =
    wordSource === "default"
      ? "Từ khóa mặc định"
      : wordSource === "custom"
        ? `${availableCustomWords.length} cặp từ tùy chỉnh`
        : `${filteredDefaultWords.length + filteredCustomWords.length} cặp từ`;

  // Đọc từ khóa đã lưu.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const validPairs = parsed.filter(
            (pair): pair is SpyWordPair =>
              pair &&
              typeof pair.id === "string" &&
              typeof pair.category === "string" &&
              typeof pair.word === "string" &&
              typeof pair.spyWord === "string",
          );

          setCustomWordPairs(validPairs);
        }
      }
    } catch {
      setCustomWordPairs([]);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  // Lưu từ khóa vào localStorage.
  useEffect(() => {
    if (!isStorageLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customWordPairs));
    } catch {
      // Trình duyệt có thể không cho phép lưu localStorage.
    }
  }, [customWordPairs, isStorageLoaded]);

  // Giới hạn số lượng gián điệp theo số người chơi.
  useEffect(() => {
    setSpyCount((previous) => Math.min(previous, maxSpies));
  }, [maxSpies]);

  function updatePlayerName(index: number, value: string) {
    setPlayerNames((previous) =>
      previous.map((name, i) => (i === index ? value : name)),
    );

    setNameError("");
  }

  function addPlayer() {
    if (playerNames.length >= 20) return;

    setPlayerNames((previous) => [
      ...previous,
      `Người chơi ${previous.length + 1}`,
    ]);

    setNameError("");
  }

  function removePlayer(index: number) {
    if (playerNames.length <= 4) return;

    setPlayerNames((previous) => previous.filter((_, i) => i !== index));

    setNameError("");
  }

  function toggleCustomWords() {
    setIsCustomWordsExpanded((previous) => {
      const next = !previous;

      if (!next) {
        setIsWordEditorOpen(false);
        setEditingWordId(null);
        setWordError("");
      }

      return next;
    });
  }

  function openAddWordEditor() {
    setEditingWordId(null);

    setWordForm({
      ...EMPTY_WORD,
      category: category !== "Tất cả chủ đề" ? category : "Đồ ăn",
    });

    setWordError("");
    setIsWordEditorOpen(true);
  }

  function openEditWordEditor(pair: SpyWordPair) {
    setEditingWordId(pair.id);

    setWordForm({
      category: pair.category,
      word: pair.word,
      spyWord: pair.spyWord,
    });

    setWordError("");
    setIsWordEditorOpen(true);
  }

  function saveWordPair() {
    const categoryValue = wordForm.category.trim();
    const word = wordForm.word.trim();
    const spyWord = wordForm.spyWord.trim();

    if (!categoryValue || !word || !spyWord) {
      setWordError("Vui lòng nhập đầy đủ chủ đề và cả hai từ khóa.");
      return;
    }

    if (word.toLocaleLowerCase() === spyWord.toLocaleLowerCase()) {
      setWordError("Hai từ khóa phải khác nhau.");
      return;
    }

    const duplicate = customWordPairs.some(
      (pair) =>
        pair.id !== editingWordId &&
        pair.category.toLocaleLowerCase() ===
          categoryValue.toLocaleLowerCase() &&
        pair.word.toLocaleLowerCase() === word.toLocaleLowerCase() &&
        pair.spyWord.toLocaleLowerCase() === spyWord.toLocaleLowerCase(),
    );

    if (duplicate) {
      setWordError("Cặp từ này đã tồn tại trong danh sách.");
      return;
    }

    if (editingWordId) {
      setCustomWordPairs((previous) =>
        previous.map((pair) =>
          pair.id === editingWordId
            ? {
                ...pair,
                category: categoryValue,
                word,
                spyWord,
              }
            : pair,
        ),
      );
    } else {
      const newPair: SpyWordPair = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: categoryValue,
        word,
        spyWord,
      };

      setCustomWordPairs((previous) => [...previous, newPair]);
    }

    setWordError("");
    setIsWordEditorOpen(false);
    setEditingWordId(null);
  }

  function deleteWordPair(id: string) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa cặp từ này?");

    if (!confirmed) return;

    setCustomWordPairs((previous) => previous.filter((pair) => pair.id !== id));
  }

  function handleCategoryChange(item: string) {
    setCategory(item);

    // Nếu danh mục chỉ có từ tùy chỉnh,
    // mở phần quản lý để người chơi có thể kiểm tra.
    const hasDefaultWord =
      item === "Tất cả chủ đề" ||
      spyWordPairs.some((pair) => pair.category === item);

    const hasCustomWord = customWordPairs.some(
      (pair) => pair.category === item,
    );

    if (!hasDefaultWord && hasCustomWord) {
      setIsCustomWordsExpanded(true);
    }
  }

  function handleWordSourceChange(source: SpyWordSource) {
    setWordSource(source);

    // Chọn từ khóa riêng thì mở phần quản lý.
    if (source === "custom") {
      setIsCustomWordsExpanded(true);
    }

    setNameError("");
  }

  function handleStart() {
    const names = playerNames.map((name) => name.trim());

    if (names.length < 4) {
      setNameError("Cần ít nhất 4 người chơi để bắt đầu.");
      return;
    }

    if (names.some((name) => !name)) {
      setNameError("Vui lòng nhập tên cho tất cả người chơi.");
      return;
    }

    const normalizedNames = names.map((name) => name.toLocaleLowerCase());

    if (new Set(normalizedNames).size !== names.length) {
      setNameError("Tên người chơi không được trùng nhau.");
      return;
    }

    if (wordSource === "custom" && filteredCustomWords.length === 0) {
      setIsCustomWordsExpanded(true);

      setNameError(
        "Chủ đề hiện tại chưa có từ khóa tùy chỉnh. Hãy thêm từ hoặc chọn nguồn từ khác.",
      );
      return;
    }

    if (wordSource === "default" && filteredDefaultWords.length === 0) {
      setNameError("Chủ đề hiện tại chưa có từ khóa mặc định phù hợp.");
      return;
    }

    if (
      wordSource === "all" &&
      filteredDefaultWords.length + filteredCustomWords.length === 0
    ) {
      setIsCustomWordsExpanded(true);

      setNameError("Không tìm thấy từ khóa phù hợp với chủ đề hiện tại.");
      return;
    }

    setNameError("");

    onStart({
      playerNames: names,
      spyCount: Math.min(spyCount, maxSpies),
      mode,
      category,
      discussionMinutes,
      wordSource,
      customWordPairs: [...customWordPairs],
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
          🕵️
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <Sparkles size={14} />
          TRÒ CHƠI TẬP THỂ
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Ai là gián điệp?
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
          Mọi người đều biết từ khóa bí mật, ngoại trừ gián điệp. Hãy tìm ra kẻ
          đang cố hòa nhập với đám đông!
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {/* Người chơi */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users size={19} className="text-blue-600" />

                <h2 className="text-lg font-extrabold text-slate-900">
                  Người chơi
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">Từ 4 đến 20 người</p>
            </div>

            <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {playerNames.length} người
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
                  {index + 1}
                </div>

                <input
                  value={name}
                  onChange={(event) =>
                    updatePlayerName(index, event.target.value)
                  }
                  maxLength={30}
                  placeholder={`Tên người chơi ${index + 1}`}
                  aria-label={`Tên người chơi ${index + 1}`}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  disabled={playerNames.length <= 4}
                  aria-label={`Xóa người chơi ${index + 1}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPlayer}
            disabled={playerNames.length >= 20}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-40"
          >
            <Plus size={17} />
            Thêm người chơi
          </button>
        </section>

        {/* Số lượng gián điệp */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕶️</span>

            <h2 className="text-lg font-extrabold text-slate-900">
              Số lượng gián điệp
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Chọn số người bí mật cần tìm ra.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((count) => {
              const disabled = count > maxSpies;
              const active = spyCount === count;

              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSpyCount(count)}
                  className={`rounded-2xl border p-4 text-center transition ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                      : "border-slate-200 text-slate-600 hover:border-blue-200"
                  } disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  <span className="block text-2xl font-black">{count}</span>

                  <span className="mt-1 block text-xs font-semibold">
                    Gián điệp
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Tối đa {maxSpies} gián điệp với {validNames.length} người chơi. Số
            lượng được điều chỉnh tự động khi thêm hoặc xóa người chơi.
          </p>
        </section>

        {/* Chủ đề */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>

            <h2 className="text-lg font-extrabold text-slate-900">
              Chủ đề từ khóa
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Chọn chủ đề phù hợp với nhóm của bạn.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {availableCategories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleCategoryChange(item)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        {/* Nguồn từ khóa */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <Library size={19} className="text-blue-600" />

            <h2 className="text-lg font-extrabold text-slate-900">
              Nguồn từ khóa
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Chọn danh sách từ sẽ được sử dụng trong trò chơi.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                value: "default",
                title: "Từ khóa mặc định",
                description: "Sử dụng danh sách từ khóa có sẵn.",
              },
              {
                value: "custom",
                title: "Từ khóa của tôi",
                description: "Chỉ sử dụng những cặp từ bạn tự tạo.",
              },
              {
                value: "all",
                title: "Kết hợp tất cả",
                description: "Chọn ngẫu nhiên từ cả hai danh sách.",
              },
            ].map((item) => {
              const active = wordSource === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    handleWordSourceChange(item.value as SpyWordSource)
                  }
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {active && <Check size={13} />}
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-600">
              {selectedWordCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {wordSource === "default"
                ? "Các từ khóa mặc định được lưu trong ứng dụng."
                : wordSource === "custom"
                  ? "Các từ tùy chỉnh được lưu trên trình duyệt này."
                  : "Kết hợp từ khóa mặc định và danh sách riêng của bạn."}
            </p>
          </div>
        </section>

        {/* Quản lý từ khóa - mặc định thu gọn */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={toggleCustomWords}
            aria-expanded={isCustomWordsExpanded}
            aria-controls="custom-word-management"
            className="flex w-full items-center justify-between gap-3 p-5 text-left transition hover:bg-slate-50 sm:p-7"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BookOpen size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Từ khóa tùy chỉnh
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Quản lý bộ từ khóa riêng của bạn.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 sm:text-sm">
                {customWordPairs.length} cặp từ
              </span>

              <ChevronDown
                size={20}
                className={`text-slate-400 transition-transform duration-300 ${
                  isCustomWordsExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {isCustomWordsExpanded && (
            <div
              id="custom-word-management"
              className="border-t border-slate-100 p-5 sm:p-7"
            >
              <p className="text-sm leading-6 text-slate-500">
                Những cặp từ bên dưới chỉ hiển thị khi bạn chủ động mở khu vực
                này. Hãy đóng lại trước khi chuyển thiết bị cho người chơi khác.
              </p>

              <button
                type="button"
                onClick={openAddWordEditor}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                <Plus size={18} />
                Thêm cặp từ mới
              </button>

              {isWordEditorOpen && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-extrabold text-slate-900">
                      {editingWordId ? "Chỉnh sửa cặp từ" : "Thêm cặp từ"}
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWordEditorOpen(false);
                        setEditingWordId(null);
                        setWordError("");
                      }}
                      aria-label="Đóng biểu mẫu"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Chủ đề
                      </label>

                      <input
                        value={wordForm.category}
                        onChange={(event) =>
                          setWordForm((previous) => ({
                            ...previous,
                            category: event.target.value,
                          }))
                        }
                        maxLength={40}
                        placeholder="Ví dụ: Du lịch"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Từ khóa dành cho dân thường
                      </label>

                      <input
                        value={wordForm.word}
                        onChange={(event) =>
                          setWordForm((previous) => ({
                            ...previous,
                            word: event.target.value,
                          }))
                        }
                        maxLength={60}
                        placeholder="Ví dụ: Đà Lạt"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Từ khóa dành cho gián điệp
                      </label>

                      <input
                        value={wordForm.spyWord}
                        onChange={(event) =>
                          setWordForm((previous) => ({
                            ...previous,
                            spyWord: event.target.value,
                          }))
                        }
                        maxLength={60}
                        placeholder="Ví dụ: Sa Pa"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    {wordError && (
                      <p
                        role="alert"
                        className="text-sm font-medium text-rose-600"
                      >
                        {wordError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={saveWordPair}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
                    >
                      <Save size={17} />
                      {editingWordId ? "Lưu thay đổi" : "Thêm vào danh sách"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {customWordPairs.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">
                    <BookOpen size={30} className="mx-auto text-slate-300" />

                    <p className="mt-3 font-bold text-slate-700">
                      Chưa có từ khóa tùy chỉnh
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Hãy thêm những cặp từ đầu tiên của bạn.
                    </p>
                  </div>
                ) : (
                  customWordPairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {pair.category}
                          </span>

                          <div className="mt-3 grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Dân thường
                              </p>

                              <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
                                {pair.word}
                              </p>
                            </div>

                            <span className="hidden text-xs font-bold text-slate-300 sm:inline">
                              ĐỐI ĐẦU
                            </span>

                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Gián điệp
                              </p>

                              <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
                                {pair.spyWord}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => openEditWordEditor(pair)}
                            aria-label={`Sửa cặp từ ${pair.word}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteWordPair(pair.id)}
                            aria-label={`Xóa cặp từ ${pair.word}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Chế độ chơi */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <Settings2 size={19} className="text-blue-600" />

            <h2 className="text-lg font-extrabold text-slate-900">
              Chế độ gián điệp
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setMode("different-word")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                mode === "different-word"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔀</span>

                <div>
                  <p className="font-bold text-slate-900">Từ khóa khác nhau</p>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Dân thường có một từ khóa, gián điệp nhận từ khóa gần nghĩa.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("no-word")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                mode === "no-word"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤫</span>

                <div>
                  <p className="font-bold text-slate-900">
                    Gián điệp không có từ khóa
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Dân thường nhận từ khóa, gián điệp phải suy luận qua lời mô
                    tả.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Thời gian */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-extrabold text-slate-900">
            ⏱ Thời gian thảo luận
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Nhập thời gian cho mỗi ván (từ 1 đến 120 phút).
          </p>

          <label className="mt-4 flex max-w-xs items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="number"
              min={1}
              max={120}
              step={1}
              value={discussionMinutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isInteger(value) && value >= 1 && value <= 120) setDiscussionMinutes(value);
              }}
              className="h-12 w-32 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              aria-label="Thời gian thảo luận tính bằng phút"
            />
            phút
          </label>
        </section>

        {nameError && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {nameError}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-base font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
        >
          <Shuffle size={19} />
          Chia vai bí mật
          <ArrowRight size={19} />
        </button>

        <p className="text-center text-xs leading-5 text-slate-400">
          Hãy đảm bảo mọi người không nhìn thấy màn hình khi người khác xem vai.
        </p>
      </div>
    </div>
  );
}
