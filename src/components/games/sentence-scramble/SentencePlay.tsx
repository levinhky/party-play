"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import type {
  SentenceQuestion,
  SentenceTeam,
} from "@/types/sentence-scramble";

interface SentencePlayProps {
  question: SentenceQuestion;
  questionNumber: number;
  totalQuestions: number;
  currentPlayerName: string;
  currentScore: number;
  isTeamMode: boolean;
  teams: SentenceTeam[];
  onCorrect: (usedHint: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

interface WordToken {
  id: number;
  text: string;
}

function normalizeSentence(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffleWords(words: WordToken[]) {
  const result = [...words];

  // Tránh giữ nguyên thứ tự đáp án ngay từ đầu.
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  if (
    result.length > 1 &&
    result.every((word, index) => word.id === index)
  ) {
    [result[0], result[1]] = [result[1], result[0]];
  }

  return result;
}

export default function SentencePlay({
  question,
  questionNumber,
  totalQuestions,
  currentPlayerName,
  currentScore,
  isTeamMode,
  teams,
  onCorrect,
  onNext,
  onBack,
}: SentencePlayProps) {
  const [availableWords, setAvailableWords] = useState<WordToken[]>(() =>
    shuffleWords(question.sentence.trim().split(/\s+/).map((text, index) => ({ id: index, text }))),
  );
  const [selectedWords, setSelectedWords] = useState<WordToken[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const addWord = (word: WordToken) => {
    if (checked) return;

    setAvailableWords((current) =>
      current.filter((item) => item.id !== word.id),
    );

    setSelectedWords((current) => [...current, word]);
  };

  const removeWord = (word: WordToken) => {
    if (checked) return;

    setSelectedWords((current) =>
      current.filter((item) => item.id !== word.id),
    );

    setAvailableWords((current) => [...current, word]);
  };

  const handleReset = () => {
    if (checked) return;

    const tokens = question.sentence
      .trim()
      .split(/\s+/)
      .map((text, index) => ({ id: index, text }));

    setAvailableWords(shuffleWords(tokens));
    setSelectedWords([]);
  };

  const handleHint = () => {
    setShowHint(true);
    setUsedHint(true);
    toast.info("Gợi ý", {
      description: question.hint,
    });
  };

  const handleCheck = () => {
    if (selectedWords.length === 0) {
      toast.warning("Bạn chưa chọn từ nào!");
      return;
    }

    const answer = selectedWords.map((word) => word.text).join(" ");
    const correct = normalizeSentence(answer) ===
      normalizeSentence(question.sentence);

    setChecked(true);
    setIsCorrect(correct);

    if (correct) {
      toast.success(usedHint ? "Chính xác! +5 điểm" : "Chính xác! +10 điểm", {
        description: "Bạn đã sắp xếp câu thành công!",
      });

      onCorrect(usedHint);
    } else {
      toast.error("Chưa chính xác!", {
        description: "Hãy xem lại thứ tự các từ nhé.",
      });
    }
  };

  const getWordStyle = (word: WordToken, selected = false) => {
    if (checked && selected && isCorrect) {
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    }

    return selected
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50";
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-blue-700">
            <ArrowLeft size={16} /> Về thiết lập
          </button>
          <p className="text-sm font-medium text-blue-600">
            {question.category}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Sắp xếp câu
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Câu {questionNumber}/{totalQuestions}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-right">
          <p className="text-xs font-medium text-blue-600">Điểm hiện tại</p>
          <p className="text-2xl font-extrabold text-blue-700">
            {currentScore}
          </p>
        </div>
      </header>

      {isTeamMode && teams.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`rounded-2xl border p-4 ${
                team.name === currentPlayerName
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="truncate text-sm font-medium text-gray-500">
                {team.name}
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {team.score} điểm
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
            {question.difficulty === "easy"
              ? "🟢 Dễ"
              : question.difficulty === "medium"
                ? "🟡 Trung bình"
                : "🔴 Khó"}
          </span>

          <span className="text-sm text-gray-500">
            Lượt của:{" "}
            <strong className="text-gray-900">{currentPlayerName}</strong>
          </span>
        </div>

        {question.translation && <div className="mb-7 rounded-2xl bg-gray-50 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">
              Nghĩa tiếng Việt
            </p>

            <button
              type="button"
              onClick={() => setShowTranslation((value) => !value)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              {showTranslation ? "Ẩn nghĩa" : "Hiện nghĩa"}
            </button>
          </div>

          {showTranslation ? (
            <p className="text-gray-700">{question.translation}</p>
          ) : (
            <p className="text-sm text-gray-400">
              Hãy thử sắp xếp câu trước khi xem nghĩa.
            </p>
          )}
        </div>}

        <div className="mb-4">
          <h2 className="mb-3 font-bold text-gray-900">
            Câu trả lời của bạn
          </h2>

          <div className="flex min-h-28 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4">
            {selectedWords.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => removeWord(word)}
                disabled={checked}
                className={`rounded-xl border px-3 py-2 font-semibold transition disabled:cursor-default ${getWordStyle(
                  word,
                  true,
                )}`}
                title="Nhấn để bỏ từ này"
              >
                {word.text}
              </button>
            ))}

            {selectedWords.length === 0 && (
              <p className="m-auto text-center text-sm text-gray-400">
                Nhấn vào các từ bên dưới để ghép thành câu...
              </p>
            )}
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900">Các từ có sẵn</h2>

            <span className="text-xs text-gray-500">
              {availableWords.length} từ
            </span>
          </div>

          <div className="flex min-h-24 flex-wrap content-start gap-2 rounded-2xl bg-gray-50 p-4">
            {availableWords.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => addWord(word)}
                disabled={checked}
                className={`rounded-xl border px-3 py-2 font-semibold transition disabled:cursor-default ${getWordStyle(
                  word,
                )}`}
              >
                {word.text}
              </button>
            ))}

            {availableWords.length === 0 && (
              <p className="m-auto text-sm text-gray-400">
                Bạn đã chọn tất cả các từ.
              </p>
            )}
          </div>
        </div>

        {showHint && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Lightbulb
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <div>
              <p className="font-bold text-amber-900">Gợi ý</p>
              <p className="mt-1 text-sm text-amber-800">{question.hint}</p>
            </div>
          </div>
        )}

        {checked && (
          <div
            className={`mb-5 flex gap-3 rounded-2xl p-4 ${
              isCorrect
                ? "border border-emerald-200 bg-emerald-50"
                : "border border-red-200 bg-red-50"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            ) : (
              <XCircle
                size={22}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}

            <div>
              <p
                className={`font-bold ${
                  isCorrect ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {isCorrect ? "Tuyệt vời! Bạn đã trả lời đúng." : "Chưa đúng!"}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {isCorrect
                  ? `Bạn nhận được ${usedHint ? 5 : 10} điểm.`
                  : "Đáp án đúng:"}
              </p>

              {!isCorrect && (
                <p className="mt-2 font-semibold text-gray-900">
                  {question.sentence}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!checked ? (
            <>
              <button
                type="button"
                onClick={handleCheck}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
              >
                <CheckCircle2 size={19} />
                Kiểm tra đáp án
              </button>

              {question.hint && <button
                type="button"
                onClick={handleHint}
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-5 py-3.5 font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                <Lightbulb size={19} />
                Gợi ý
              </button>}

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RotateCcw size={18} />
                Làm lại
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
            >
              Câu tiếp theo
              <ArrowRight size={19} />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
