"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import BackToGamesButton from "@/components/games/BackToGamesButton";
import { defaultFlashcards } from "@/data/flashcards";
import type {
  Flashcard,
  FlashcardsSettings,
  FlashcardSource,
} from "@/types/flashcards";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const STORAGE_KEY = "party-play-flashcards-custom-cards";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function isFlashcard(value: unknown): value is Flashcard {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<Flashcard>;
  return (
    typeof card.id === "string" &&
    typeof card.word === "string" &&
    (card.meaning === undefined || typeof card.meaning === "string") &&
    (card.imageUrl === undefined || typeof card.imageUrl === "string")
  );
}

interface Props {
  onStart: (settings: FlashcardsSettings) => void;
}

export default function FlashcardsSetup({ onStart }: Props) {
  const [customCards, setCustomCards] = useState<Flashcard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<FlashcardSource>("default");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [permanentUser, setPermanentUser] = useState<User | null>(null);
  const [jsonImport, setJsonImport] = useState("");
  const [jsonStatus, setJsonStatus] = useState("");
  const [savingCards, setSavingCards] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        setCustomCards(Array.isArray(parsed) ? parsed.filter(isFlashcard) : []);
      } catch {
        setCustomCards([]);
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customCards));
    } catch {
      /* Keep the current list available for this visit. */
    }
  }, [customCards, loaded]);

  const selectedCount = useMemo(() => {
    if (source === "custom") return customCards.length;
    if (source === "combined")
      return defaultFlashcards.length + customCards.length;
    return defaultFlashcards.length;
  }, [customCards.length, source]);

  const addCard = () => {
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    const cleanImageUrl = imageUrl.trim();
    if (!cleanWord) {
      setError("Hãy nhập từ vựng.");
      return;
    }
    if (
      [...defaultFlashcards, ...customCards].some(
        (card) =>
          card.id !== editingCardId &&
          card.word.toLocaleLowerCase("vi") ===
            cleanWord.toLocaleLowerCase("vi"),
      )
    ) {
      setError("Từ này đã có trong bộ thẻ.");
      return;
    }
    if (cleanImageUrl) {
      try {
        const parsedUrl = new URL(cleanImageUrl);
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:")
          throw new Error("invalid protocol");
      } catch {
        setError(
          "Ảnh chỉ nhận đường dẫn URL bắt đầu bằng http:// hoặc https://.",
        );
        return;
      }
    }
    const cardData: Flashcard = {
      id: editingCardId ?? `custom-${crypto.randomUUID()}`,
      word: cleanWord,
      ...(cleanMeaning ? { meaning: cleanMeaning } : {}),
      ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
    };
    const nextCards = editingCardId
      ? customCards.map((card) => (card.id === editingCardId ? cardData : card))
      : [...customCards, cardData];

    setCustomCards(nextCards);
    void syncAccountCards(nextCards);
    setEditingCardId(null);
    setWord("");
    setMeaning("");
    setImageUrl("");
    setError("");
    setSource((current) => (current === "default" ? "custom" : current));
  };

  const editCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setWord(card.word);
    setMeaning(card.meaning ?? "");
    setImageUrl(card.imageUrl ?? "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setWord("");
    setMeaning("");
    setImageUrl("");
    setError("");
  };

  const removeCard = (cardId: string) => {
    const nextCards = customCards.filter((card) => card.id !== cardId);
    setCustomCards(nextCards);
    void syncAccountCards(nextCards);
    if (editingCardId === cardId) cancelEdit();
  };

  const handleStart = () => {
    if (selectedCount < 1) {
      setError("Hãy thêm ít nhất một thẻ hoặc chọn bộ thẻ có sẵn.");
      return;
    }
    setError("");
    onStart({ source, customCards });
  };

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      if (!active) return;
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
      .from("flashcard_custom_cards")
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
          .filter(isFlashcard);
        if (accountCards.length > 0) setCustomCards(accountCards);
      });

    return () => {
      active = false;
    };
  }, [permanentUser]);

  const syncAccountCards = async (cards: Flashcard[]) => {
    if (!permanentUser) return;

    setSavingCards(true);
    try {
      await supabase
        .from("flashcard_custom_cards")
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
          .from("flashcard_custom_cards")
          .insert(rows);
        if (saveError) throw saveError;
      }

      setJsonStatus(`Đã lưu ${cards.length} thẻ vào tài khoản.`);
    } catch (caught) {
      setJsonStatus(
        caught instanceof Error
          ? `Không lưu được thẻ tài khoản: ${caught.message}`
          : "Không lưu được thẻ tài khoản.",
      );
    } finally {
      setSavingCards(false);
    }
  };

  const importJsonCards = () => {
    try {
      const parsed: unknown = JSON.parse(jsonImport);
      const rawCards = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "cards" in parsed
          ? (parsed as { cards?: unknown }).cards
          : null;

      if (!Array.isArray(rawCards)) {
        setError("JSON phải là một mảng thẻ hoặc object có trường cards.");
        return;
      }

      const imported: Flashcard[] = [];

      for (const [index, rawCard] of rawCards.entries()) {
        if (!rawCard || typeof rawCard !== "object") {
          throw new Error(`Thẻ thứ ${index + 1} không hợp lệ.`);
        }

        const value = rawCard as Record<string, unknown>;
        const word = String(value.keywords ?? value.word ?? "").trim();
        const meaning = String(value.meaning ?? "").trim();
        const imageUrl = String(value.urlImage ?? value.imageUrl ?? "").trim();

        if (!word) {
          throw new Error(`Thẻ thứ ${index + 1} thiếu keywords.`);
        }

        if (imageUrl) {
          try {
            const parsedUrl = new URL(imageUrl);
            if (
              parsedUrl.protocol !== "https:" &&
              parsedUrl.protocol !== "http:"
            ) {
              throw new Error("invalid protocol");
            }
          } catch {
            throw new Error(`Thẻ thứ ${index + 1} có urlImage không hợp lệ.`);
          }
        }

        imported.push({
          id:
            typeof value.id === "string" && value.id.trim()
              ? value.id.trim()
              : `custom-${crypto.randomUUID()}`,
          word,
          ...(meaning ? { meaning } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        });
      }

      const merged = [...customCards];
      for (const card of imported) {
        if (
          !merged.some(
            (existing) =>
              existing.id === card.id ||
              existing.word.toLocaleLowerCase("vi") ===
                card.word.toLocaleLowerCase("vi"),
          )
        ) {
          merged.push(card);
        }
      }

      setCustomCards(merged);
      setSource((current) => (current === "default" ? "custom" : current));
      setJsonStatus(`Đã nhập ${imported.length} thẻ JSON.`);
      setJsonImport("");
      setError("");
      void syncAccountCards(merged);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "JSON thẻ không hợp lệ.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <BackToGamesButton
          label="Quay lại"
          iconSize={16}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        />

        <header className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-blue-600">
              Tiếng Anh · Thẻ từ vựng
            </p>
            <h1 className="mt-0.5 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              Thẻ từ vựng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ôn từ theo bộ có sẵn hoặc tự tạo.
            </p>
          </div>
        </header>

        <div className="space-y-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Bộ thẻ</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {selectedCount} thẻ
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["default", "Có sẵn", `${defaultFlashcards.length} thẻ`],
                  ["custom", "Của tôi", `${customCards.length} thẻ`],
                  [
                    "combined",
                    "Kết hợp",
                    `${defaultFlashcards.length + customCards.length} thẻ`,
                  ],
                ] as [FlashcardSource, string, string][]
              ).map(([value, label, detail]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className={`rounded-xl border p-3.5 text-left transition ${source === value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-200"}`}
                >
                  <span className="block font-bold text-slate-900">
                    {label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {detail}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <details className="group rounded-2xl border border-blue-100 bg-[#f8fbff]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-3.5 transition hover:bg-blue-50/70 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-bold text-slate-900">
                  Tạo / quản lý thẻ riêng
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {customCards.length} thẻ đã lưu
                  {permanentUser ? " trong tài khoản" : " trên thiết bị này"}
                </span>
              </span>
              <ChevronDown
                size={18}
                className="text-slate-500 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="space-y-3 border-t border-blue-100 p-3.5">
              <label className="block text-sm font-semibold text-slate-700">
                Từ vựng
                <input
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  maxLength={100}
                  className={`${fieldClass} mt-2`}
                  placeholder="Ví dụ: Lighthouse"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Nghĩa / giải thích{" "}
                <span className="font-normal text-slate-400">
                  (không bắt buộc)
                </span>
                <input
                  value={meaning}
                  onChange={(event) => setMeaning(event.target.value)}
                  maxLength={240}
                  className={`${fieldClass} mt-2`}
                  placeholder="Ví dụ: Ngọn hải đăng"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                URL hình ảnh{" "}
                <span className="font-normal text-slate-400">
                  (không bắt buộc)
                </span>
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  maxLength={2000}
                  inputMode="url"
                  type="url"
                  className={`${fieldClass} mt-2 font-normal`}
                  placeholder="https://example.com/image.jpg"
                />
              </label>
              <p className="text-xs leading-5 text-slate-500">
                Chỉ nhập liên kết ảnh http:// hoặc https://; không tải tệp ảnh
                lên.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addCard}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {editingCardId ? (
                    <>
                      <Save size={17} />
                      Lưu thay đổi
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Thêm thẻ
                    </>
                  )}
                </button>
                {editingCardId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <X size={17} />
                    Hủy sửa
                  </button>
                )}
              </div>
              {customCards.length > 0 && (
                <div className="space-y-2 pt-2">
                  {customCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {card.word}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {card.meaning || "Chưa có nghĩa"}
                          {card.imageUrl ? " · Có ảnh URL" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={`Sửa thẻ ${card.word}`}
                          onClick={() => editCard(card)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa thẻ ${card.word}`}
                          onClick={() => removeCard(card.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          <label className="block text-sm font-semibold text-slate-700">
            Nhập thẻ từ vựng (JSON: keywords, meaning, urlImage)
            <textarea
              value={jsonImport}
              onChange={(event) => setJsonImport(event.target.value)}
              rows={4}
              className={`${fieldClass} mt-2 resize-none`}
              placeholder='[{"keywords":"Lighthouse","meaning":"Ngọn hải đăng","urlImage":"https://example.com/image.jpg"}]'
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={importJsonCards}
              disabled={savingCards || !jsonImport.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Nhập thẻ từ JSON
            </button>
            <button
              type="button"
              onClick={() => setJsonImport("")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              <X size={17} />
              Xóa nội dung
            </button>
          </div>
          {jsonStatus && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {jsonStatus}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
          >
            Bắt đầu học {selectedCount} thẻ <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
