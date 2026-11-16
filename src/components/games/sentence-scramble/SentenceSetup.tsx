"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  Users,
  UserRound,
  Pencil,
  X,
} from "lucide-react";

import {
  sentenceDifficultyLabels,
  sentenceQuestions,
} from "@/data/sentenceScramble";
import SentenceDeckAccount from "@/components/games/sentence-scramble/SentenceDeckAccount";
import type {
  SentenceDifficulty,
  SentenceSettings,
  SentenceTeam,
} from "@/types/sentence-scramble";
import { useRouter } from "next/navigation";

const CUSTOM_SENTENCES_KEY = "party-play-sentence-scramble-custom-sentences";

interface SentenceSetupProps {
  onStart: (settings: SentenceSettings) => void;
}

export default function SentenceSetup({ onStart }: SentenceSetupProps) {
  const [mode, setMode] = useState<"individual" | "team">("team");
  const [playStyle, setPlayStyle] = useState<"interactive" | "paper">(
    "interactive",
  );
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [questionSource, setQuestionSource] = useState<
    "default" | "custom" | "combined"
  >("default");
  const [customSentences, setCustomSentences] = useState<string[]>([]);
  const [customSentencesLoaded, setCustomSentencesLoaded] = useState(false);
  const [sentenceDraft, setSentenceDraft] = useState("");
  const [editingSentenceIndex, setEditingSentenceIndex] = useState<
    number | null
  >(null);
  const [playerNames, setPlayerNames] = useState("Người chơi 1, Người chơi 2");
  const [team1, setTeam1] = useState("Đội 1");
  const [team2, setTeam2] = useState("Đội 2");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(CUSTOM_SENTENCES_KEY);
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        setCustomSentences(
          Array.isArray(parsed)
            ? parsed.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : [],
        );
      } catch {
        setCustomSentences([]);
      } finally {
        setCustomSentencesLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!customSentencesLoaded) return;
    try {
      localStorage.setItem(
        CUSTOM_SENTENCES_KEY,
        JSON.stringify(customSentences),
      );
    } catch {
      // Keep the custom sentence list available during this setup session.
    }
  }, [customSentences, customSentencesLoaded]);

  const addCustomSentences = () => {
    const additions = sentenceDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (additions.length === 0) {
      setError("Nhập ít nhất một câu rồi bấm thêm vào bộ câu.");
      return;
    }
    if (editingSentenceIndex !== null && additions.length !== 1) {
      setError("Khi sửa, chỉ nhập một câu.");
      return;
    }
    const existing = new Set(
      customSentences
        .filter((_, index) => index !== editingSentenceIndex)
        .map((sentence) => sentence.toLocaleLowerCase()),
    );
    const uniqueAdditions = additions.filter((sentence) => {
      const key = sentence.toLocaleLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (uniqueAdditions.length === 0) {
      setError("Các câu này đã có trong bộ câu tự tạo.");
      return;
    }
    if (editingSentenceIndex !== null) {
      setCustomSentences((current) =>
        current.map((sentence, index) =>
          index === editingSentenceIndex ? uniqueAdditions[0] : sentence,
        ),
      );
      setEditingSentenceIndex(null);
    } else {
      setCustomSentences((current) => [...current, ...uniqueAdditions]);
      setQuestionSource((current) =>
        current === "default" ? "custom" : current,
      );
    }
    setSentenceDraft("");
    setError("");
  };

  const cancelSentenceEdit = () => {
    setEditingSentenceIndex(null);
    setSentenceDraft("");
    setError("");
  };

  const handleStart = () => {
    if (questionSource === "custom" && customSentences.length === 0) {
      setError("Hãy thêm ít nhất một câu hoặc chọn bộ câu có sẵn.");
      return;
    }
    const names = playerNames
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const teams: SentenceTeam[] = [
      {
        id: "team-1",
        name: team1.trim() || "Đội 1",
        score: 0,
        members: mode === "team" ? names : [],
      },
      {
        id: "team-2",
        name: team2.trim() || "Đội 2",
        score: 0,
        members: mode === "team" ? names : [],
      },
    ];

    onStart({
      mode,
      playStyle,
      difficulty,
      totalQuestions:
        questionSource === "custom" ? customSentences.length : totalQuestions,
      questionSource,
      customSentences,
      playerNames: names.length ? names : ["Người chơi 1"],
      teams: mode === "team" ? teams : [],
    });
  };

  const router = useRouter();

  const handleGoBack = () => {
    navigateWithLoading(() => router.push("/games"));
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <button
        type="button"
        onClick={handleGoBack}
        className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        ← Quay lại
      </button>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <BookOpen size={32} />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Sắp xếp câu
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-gray-500">
          Sắp xếp các từ bị xáo trộn để tạo thành câu tiếng Anh hoàn chỉnh. Càng
          nhanh và chính xác, điểm số của bạn càng cao!
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <SentenceDeckAccount
          sentences={customSentences}
          onLoadDeck={(sentences) => {
            setCustomSentences(sentences);
            setQuestionSource("custom");
          }}
        />

        <section>
          <h2 className="mb-3 font-bold text-gray-900">Cách chơi</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlayStyle("interactive")}
              className={`rounded-2xl border p-4 text-left transition ${playStyle === "interactive" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
            >
              <p className="font-semibold text-gray-900">
                Sắp xếp trên màn hình
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Chọn các từ để tạo thành câu như hiện tại.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlayStyle("paper")}
              className={`rounded-2xl border p-4 text-left transition ${playStyle === "paper" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
            >
              <p className="font-semibold text-gray-900">Viết câu ra giấy</p>
              <p className="mt-1 text-xs text-gray-500">
                Xem nhiều câu lộn xộn cùng lúc, tự ghi đáp án rồi mở đáp án
                chuẩn.
              </p>
            </button>
          </div>
        </section>

        {playStyle === "paper" && (
          <Link
            href="/games/sentence-scramble/online"
            className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 transition hover:border-blue-400 hover:bg-blue-100"
          >
            <span>
              <span className="block font-bold text-blue-950">
                Chơi giấy bút trực tuyến
              </span>
              <span className="mt-1 block text-sm text-blue-700">
                Tạo phòng và giao bộ câu riêng cho từng đội hoặc người chơi.
              </span>
            </span>
            <ArrowRight className="shrink-0 text-blue-700" size={20} />
          </Link>
        )}

        {playStyle === "interactive" && (
          <section>
            <h2 className="mb-3 font-bold text-gray-900">Cách tính điểm</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("individual")}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  mode === "individual"
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <UserRound className="shrink-0 text-blue-600" size={22} />
                <div>
                  <p className="font-semibold text-gray-900">Cá nhân</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Tự thử thách bản thân
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("team")}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  mode === "team"
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="shrink-0 text-blue-600" size={22} />
                <div>
                  <p className="font-semibold text-gray-900">Theo đội</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Thi đua tính điểm
                  </p>
                </div>
              </button>
            </div>
          </section>
        )}

        {playStyle === "interactive" && mode === "team" && (
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900">Tên đội</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={team1}
                onChange={(event) => setTeam1(event.target.value)}
                placeholder="Tên đội 1"
                maxLength={40}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                value={team2}
                onChange={(event) => setTeam2(event.target.value)}
                placeholder="Tên đội 2"
                maxLength={40}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>
        )}

        {playStyle === "interactive" && mode === "individual" && (
          <section>
            <label className="mb-2 block font-bold text-gray-900">
              Tên người chơi
            </label>

            <input
              value={playerNames}
              onChange={(event) => setPlayerNames(event.target.value)}
              placeholder="Nhập tên người chơi"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Nếu có nhiều người, hãy phân cách tên bằng dấu phẩy.
            </p>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-bold text-gray-900">Độ khó</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              Object.entries(sentenceDifficultyLabels) as [
                SentenceDifficulty,
                (typeof sentenceDifficultyLabels)[SentenceDifficulty],
              ][]
            ).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDifficulty(key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  difficulty === key
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-bold text-gray-900">{value.label}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {value.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-bold text-gray-900">Bộ câu hỏi</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["default", "Câu có sẵn", `${sentenceQuestions.length} câu`],
                ["custom", "Câu của tôi", `${customSentences.length} câu`],
                ["combined", "Kết hợp", "Dùng cả hai bộ"],
              ] as const
            ).map(([value, title, detail]) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuestionSource(value)}
                className={`rounded-2xl border p-4 text-left transition ${questionSource === value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span className="block font-semibold text-gray-900">
                  {title}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {detail}
                </span>
              </button>
            ))}
          </div>

          <details className="group mt-4 rounded-2xl border border-gray-200 bg-gray-50/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 transition hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-semibold text-gray-900">
                  Tạo / quản lý câu riêng
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {customSentences.length} câu đã lưu
                </span>
              </span>
              <ChevronDown
                size={18}
                className="text-gray-500 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-gray-200 p-4">
              <label className="block text-sm font-semibold text-gray-700">
                {editingSentenceIndex === null
                  ? "Mỗi dòng là một câu tiếng Anh"
                  : `Chỉnh sửa câu ${editingSentenceIndex + 1}`}
                <textarea
                  value={sentenceDraft}
                  onChange={(event) => setSentenceDraft(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={
                    "Ví dụ:\nI enjoy reading books.\nShe is going to visit her grandmother."
                  }
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {editingSentenceIndex !== null && (
                  <button
                    type="button"
                    onClick={cancelSentenceEdit}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
                  >
                    <X size={16} />
                    Hủy sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={addCustomSentences}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {editingSentenceIndex === null ? (
                    <>
                      <Plus size={17} />
                      Thêm câu vào bộ
                    </>
                  ) : (
                    <>
                      <Pencil size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
              {customSentences.length > 0 && (
                <div className="mt-4 space-y-2">
                  {customSentences.map((sentence, index) => (
                    <div
                      key={`${sentence}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
                    >
                      <p className="min-w-0 flex-1 text-sm leading-5 text-gray-700">
                        {sentence}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Sửa câu ${index + 1}`}
                          onClick={() => {
                            setEditingSentenceIndex(index);
                            setSentenceDraft(sentence);
                            setError("");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa câu ${index + 1}`}
                          onClick={() => {
                            setCustomSentences((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            );
                            if (editingSentenceIndex === index)
                              cancelSentenceEdit();
                            else if (
                              editingSentenceIndex !== null &&
                              editingSentenceIndex > index
                            )
                              setEditingSentenceIndex(editingSentenceIndex - 1);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {customSentencesLoaded && customSentences.length === 0 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <FileText size={14} />
                  Câu tự tạo được lưu trên thiết bị này cho lần chơi sau.
                </p>
              )}
            </div>
          </details>
        </section>

        {questionSource === "custom" ? (
          <section className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Bộ câu riêng sẽ dùng toàn bộ {customSentences.length} câu đã lưu
            trong lượt chơi.
          </section>
        ) : (
          <section>
            <h2 className="mb-3 font-bold text-gray-900">Số câu hỏi</h2>

            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalQuestions(count)}
                  className={`rounded-xl border px-4 py-3 font-semibold transition ${
                    totalQuestions === count
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {count} câu
                </button>
              ))}
            </div>
          </section>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700"
        >
          Bắt đầu chơi
          <ArrowRight size={20} />
        </button>
      </div>
    </main>
  );
}
