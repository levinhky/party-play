"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from "lucide-react";
import type { Flashcard } from "@/types/flashcards";

interface Props {
  card: Flashcard;
  index: number;
  total: number;
  complete: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onReview: () => void;
}

export default function FlashcardStudy({ card, index, total, complete, onPrevious, onNext, onReview }: Props) {
  const [showMeaning, setShowMeaning] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/games" className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"><ArrowLeft size={16} />Trò chơi</Link>
          <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">THẺ TỪ VỰNG</span>
        </div>

        <header className="mb-3 flex items-end justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3.5 shadow-sm">
          <div><p className="text-xs font-semibold text-blue-700">Bộ từ vựng</p><h1 className="mt-0.5 text-xl font-black text-slate-900 sm:text-2xl">Thẻ từ vựng</h1></div>
          <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-bold tabular-nums text-blue-800">{Math.min(index + 1, total)} <span className="text-blue-400">/</span> {total}</span>
        </header>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>

        {complete ? (
          <section className="rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-sm sm:p-9">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Check size={28} /></div>
            <h2 className="mt-4 text-2xl font-black text-slate-900">Đã xem hết bộ thẻ</h2>
            <p className="mt-1.5 text-sm text-slate-500">Ôn lại để ghi nhớ từ vựng lâu hơn.</p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
              <button type="button" onClick={onReview} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"><RotateCcw size={17} />Ôn lại</button>
              <Link href="/games/flashcards" className="rounded-xl border border-blue-100 px-5 py-3 font-bold text-blue-800 hover:bg-blue-50">Chọn bộ khác</Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="[perspective:1200px]">
              <div
                className="relative min-h-[340px] rounded-xl sm:min-h-[390px]"
                style={{
                  transform: showMeaning ? "rotateY(180deg)" : "rotateY(0deg)",
                  transformStyle: "preserve-3d",
                  transition: "transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <div aria-hidden={showMeaning} className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 px-5 py-7 text-center" style={{ backfaceVisibility: "hidden" }}>
                  <button type="button" aria-label="Lật thẻ để xem từ vựng và nghĩa" tabIndex={showMeaning ? -1 : 0} onClick={() => setShowMeaning(true)} className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-7xl font-black text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">?</button>
                </div>
                <div aria-hidden={!showMeaning} className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-white px-5 py-6 text-center" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                  {card.imageUrl && !imageFailed ? (
                    // User-provided URLs can be from any host, so render the image directly instead of using a configured image host.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.imageUrl} alt={card.word} referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="mb-3 max-h-36 max-w-full rounded-xl object-contain shadow-md sm:max-h-44" />
                  ) : card.imageUrl ? <div className="mb-3 flex h-24 w-36 items-center justify-center rounded-xl bg-white/80 text-sm text-slate-400">Không tải được ảnh</div> : null}
                  <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700"><BookOpen size={14} />Đáp án</span>
                  <p className="max-w-xl break-words text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{card.word}</p>
                  {card.meaning && <p className="mt-2 max-w-xl break-words text-lg font-semibold leading-relaxed text-blue-800 sm:text-xl">{card.meaning}</p>}
                  <button type="button" tabIndex={showMeaning ? 0 : -1} onClick={() => setShowMeaning(false)} className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-800 shadow-sm transition hover:bg-blue-50">Úp thẻ lại</button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" disabled={index === 0} onClick={onPrevious} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={16} />Trước</button>
              <button type="button" onClick={onNext} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">{index === total - 1 ? "Hoàn tất" : "Tiếp theo"}<ArrowRight size={16} /></button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
