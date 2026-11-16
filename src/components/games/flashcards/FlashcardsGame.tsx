"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, LoaderCircle } from "lucide-react";
import FlashcardsSetup from "@/components/games/flashcards/FlashcardsSetup";
import FlashcardStudy from "@/components/games/flashcards/FlashcardStudy";
import { defaultFlashcards } from "@/data/flashcards";
import type { Flashcard, FlashcardsSettings } from "@/types/flashcards";

const ACTIVE_GAME_KEY = "party-play-flashcards-active-game";

interface Props {
  startRoute?: boolean;
}

function isSettings(value: unknown): value is FlashcardsSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<FlashcardsSettings>;
  return ["default", "custom", "combined"].includes(settings.source ?? "")
    && Array.isArray(settings.customCards)
    && settings.customCards.every((card) => card && typeof card.id === "string" && typeof card.word === "string"
      && (card.meaning === undefined || typeof card.meaning === "string")
      && (card.imageUrl === undefined || typeof card.imageUrl === "string"));
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function FlashcardsGame({ startRoute = false }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<FlashcardsSettings | null>(null);
  const [ready, setReady] = useState(!startRoute);
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!startRoute) return;
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(ACTIVE_GAME_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (isSettings(parsed)) setSettings(parsed);
      } catch {
        setSettings(null);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [startRoute]);

  const deck = useMemo(() => {
    if (!settings) return [];
    const cards = settings.source === "custom"
      ? settings.customCards
      : settings.source === "combined"
        ? [...defaultFlashcards, ...settings.customCards]
        : defaultFlashcards;
    return shuffle(cards);
  }, [settings]);

  const startGame = useCallback((next: FlashcardsSettings) => {
    try {
      sessionStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(next));
      navigateWithLoading(() => router.push("/games/flashcards/start"));
    } catch {
      window.alert("Không thể lưu thiết lập trò chơi trên thiết bị này.");
    }
  }, [router]);

  const showPrevious = () => {
    setComplete(false);
    setIndex((current) => Math.max(0, current - 1));
  };

  const showNext = () => {
    if (index >= deck.length - 1) {
      setComplete(true);
      return;
    }
    setIndex((current) => current + 1);
  };

  const reviewAgain = () => {
    setIndex(0);
    setComplete(false);
  };

  if (!startRoute) return <FlashcardsSetup onStart={startGame} />;

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-4"><div role="status" className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-blue-800 shadow-sm"><LoaderCircle size={19} className="animate-spin" />Đang mở bộ thẻ...</div></main>;
  }

  if (!settings || deck.length === 0) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-4 text-center"><section className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen size={24} /></div><h1 className="mt-4 text-xl font-black text-slate-900">Chưa có bộ thẻ để học</h1><p className="mt-2 text-sm leading-6 text-slate-500">Hãy quay lại thiết lập để chọn hoặc tạo bộ từ vựng.</p><Link href="/games/flashcards" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"><ArrowLeft size={16} />Về thiết lập</Link></section></main>;
  }

  const card: Flashcard = deck[index];
  return <FlashcardStudy key={card?.id ?? "complete"} card={card ?? deck[deck.length - 1]} index={index} total={deck.length} complete={complete} onPrevious={showPrevious} onNext={showNext} onReview={reviewAgain} />;
}
