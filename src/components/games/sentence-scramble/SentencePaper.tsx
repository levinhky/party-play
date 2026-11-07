"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, FileText } from "lucide-react";
import type { SentenceQuestion } from "@/types/sentence-scramble";

interface Props {
  questions: SentenceQuestion[];
  onBack: () => void;
}

function scramble(sentence: string) {
  const words = sentence.trim().split(/\s+/);
  const original = [...words];
  for (let index = words.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [words[index], words[target]] = [words[target], words[index]];
  }
  if (words.length > 1 && words.every((word, index) => word === original[index])) {
    [words[0], words[1]] = [words[1], words[0]];
  }
  return words;
}

export default function SentencePaper({ questions, onBack }: Props) {
  const [showAnswers, setShowAnswers] = useState(false);
  const scrambledQuestions = useMemo(
    () => questions.map((question) => ({ question, words: scramble(question.sentence) })),
    [questions],
  );

  return (
    <main className="min-h-screen bg-[#f6f5ff] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:text-violet-700">
            <ArrowLeft size={17} /> Về thiết lập
          </button>
          <Link href="/games" className="text-sm font-semibold text-slate-500 transition hover:text-violet-700">Quay lại Games</Link>
        </div>

        <header className="mb-6 rounded-3xl border border-white bg-white/85 p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><FileText size={23} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Sentence Scramble · Giấy bút</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Viết lại các câu hoàn chỉnh</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Ghi số câu và đáp án ra giấy. Khi làm xong, bấm kiểm tra để xem toàn bộ đáp án chuẩn.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm">
            <span className="font-semibold text-violet-900">{questions.length} câu trong lượt này</span>
            <span className="text-violet-700">Độ khó: {questions[0]?.difficulty === "easy" ? "Dễ" : questions[0]?.difficulty === "hard" ? "Khó" : "Trung bình"}</span>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {scrambledQuestions.map(({ question, words }, index) => (
            <article key={question.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Câu {index + 1}</span>
                <span className="text-xs font-medium text-slate-400">{question.category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {words.map((word, wordIndex) => (
                  <span key={`${question.id}-${wordIndex}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-700 sm:text-base">{word}</span>
                ))}
              </div>
              {showAnswers && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700"><Check size={14} />Đáp án</p>
                  <p className="font-bold leading-6 text-emerald-950">{question.sentence}</p>
                </div>
              )}
            </article>
          ))}
        </section>

        <button type="button" onClick={() => setShowAnswers((visible) => !visible)} className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold text-white shadow-lg transition ${showAnswers ? "bg-slate-700 shadow-slate-200 hover:bg-slate-800" : "bg-violet-600 shadow-violet-200 hover:bg-violet-700"}`}>
          {showAnswers ? <EyeOff size={19} /> : <Eye size={19} />}
          {showAnswers ? "Ẩn đáp án" : "Kiểm tra đáp án"}
        </button>
      </div>
    </main>
  );
}
