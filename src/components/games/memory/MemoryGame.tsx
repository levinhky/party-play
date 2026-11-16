"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import MemorySetup from "@/components/games/memory/MemorySetup";
import MemoryBoard from "@/components/games/memory/MemoryBoard";
import MemoryScoreboard from "@/components/games/memory/MemoryScoreboard";
import MemoryResults from "@/components/games/memory/MemoryResults";

import {
  memoryDifficultyConfig,
  memoryIconCards,
  memoryVocabularyCards,
} from "@/data/memoryCards";

import type {
  MemoryCardData,
  MemoryCardState,
  MemoryGameState,
  MemoryPlayer,
  MemorySettings,
} from "@/types/memory";

function shuffleCards<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createDeck(
  settings: MemorySettings,
): MemoryCardState[] {
  const vocabularySource = settings.vocabularySource === "custom"
    ? settings.customVocabulary
    : settings.vocabularySource === "combined"
      ? [...memoryVocabularyCards, ...settings.customVocabulary]
      : memoryVocabularyCards;
  const source = settings.mode === "icons" ? memoryIconCards : vocabularySource;
  const pairCount = Math.min(memoryDifficultyConfig[settings.difficulty].pairCount, source.length);

  const selectedCards = shuffleCards(source).slice(0, pairCount);

  const cards: MemoryCardData[] =
    settings.mode === "icons"
      ? selectedCards.flatMap((card) => [
          {
            ...card,
            id: `${card.id}-a`,
          },
          {
            ...card,
            id: `${card.id}-b`,
          },
        ])
      : selectedCards.flatMap((card) => [
          {
            ...card,
            id: `${card.id}-en`,
            content: card.content,
            matchContent: undefined,
          },
          {
            ...card,
            id: `${card.id}-vi`,
            content: card.matchContent ?? "",
            matchContent: undefined,
          },
        ]);

  return shuffleCards(cards).map((card) => ({
    ...card,
    isFlipped: false,
    isMatched: false,
  }));
}

function createPlayers(names: string[]): MemoryPlayer[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    score: 0,
  }));
}

function createInitialState(): MemoryGameState {
  return {
    phase: "setup",
    players: [],
    cards: [],
    currentPlayerIndex: 0,
    moves: 0,
    matchedPairs: 0,
    startedAt: null,
    elapsedSeconds: 0,
    settings: {
      playerNames: ["Người chơi 1", "Người chơi 2"],
      difficulty: "easy",
      mode: "icons",
      vocabularySource: "default",
      customVocabulary: [],
    },
  };
}

const ACTIVE_GAME_KEY = "party-play-memory-active-game";

interface MemoryGameProps {
  startRoute?: boolean;
}

function isMemorySettings(value: unknown): value is MemorySettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<MemorySettings>;
  return Array.isArray(settings.playerNames)
    && settings.playerNames.length > 0
    && ["easy", "medium", "hard"].includes(settings.difficulty ?? "")
    && ["icons", "vocabulary"].includes(settings.mode ?? "")
    && ["default", "custom", "combined"].includes(settings.vocabularySource ?? "")
    && Array.isArray(settings.customVocabulary);
}

export default function MemoryGame({ startRoute = false }: MemoryGameProps) {
  const router = useRouter();
  const [game, setGame] = useState<MemoryGameState>(createInitialState);
  const [startRouteReady, setStartRouteReady] = useState(!startRoute);

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const clearResolveTimeout = useCallback(() => {
    if (resolveTimeoutRef.current) {
      clearTimeout(resolveTimeoutRef.current);
      resolveTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearResolveTimeout();
    };
  }, [clearResolveTimeout]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (game.phase !== "playing" || game.startedAt === null) {
      return;
    }

    const updateTimer = () => {
      setGame((current) => {
        if (
          current.phase !== "playing" ||
          current.startedAt === null
        ) {
          return current;
        }

        return {
          ...current,
          elapsedSeconds: Math.floor(
            (Date.now() - current.startedAt) / 1000,
          ),
        };
      });
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [game.phase, game.startedAt]);

  const startGame = useCallback((settings: MemorySettings) => {
    clearTimeout(resolveTimeoutRef.current ?? undefined);

    const players = createPlayers(settings.playerNames);

    setSelectedCardIds([]);
    setIsResolving(false);

    setGame({
      phase: "playing",
      players,
      cards: createDeck(settings),
      currentPlayerIndex: 0,
      moves: 0,
      matchedPairs: 0,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      settings,
    });
  }, []);

  const handleSetupStart = useCallback((settings: MemorySettings) => {
    try {
      sessionStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(settings));
      navigateWithLoading(() => router.push("/games/memory/start"));
    } catch {
      window.alert("Không thể lưu thiết lập trò chơi trên thiết bị này.");
    }
  }, [router]);

  useEffect(() => {
    if (!startRoute) return;
    const timer = setTimeout(() => {
      try {
        const rawSettings = sessionStorage.getItem(ACTIVE_GAME_KEY);
        const settings: unknown = rawSettings ? JSON.parse(rawSettings) : null;
        if (isMemorySettings(settings)) startGame(settings);
      } catch (error) {
        console.error("Unable to restore Memory settings:", error);
      } finally {
        setStartRouteReady(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [startGame, startRoute]);

  const resetGame = useCallback(() => {
    clearResolveTimeout();

    setSelectedCardIds([]);
    setIsResolving(false);

    setGame(createInitialState());
    if (startRoute) {
      try {
        sessionStorage.removeItem(ACTIVE_GAME_KEY);
      } catch {
        // Continue to the setup route if browser storage is unavailable.
      }
      navigateWithLoading(() => router.push("/games/memory"));
    }
  }, [clearResolveTimeout, router, startRoute]);

  const playAgain = useCallback(() => {
    const settings = gameRef.current.settings;

    startGame(settings);
  }, [startGame]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (isResolving) return;

      const current = gameRef.current;

      if (current.phase !== "playing") return;

      const clickedCard = current.cards.find(
        (card) => card.id === cardId,
      );

      if (
        !clickedCard ||
        clickedCard.isFlipped ||
        clickedCard.isMatched
      ) {
        return;
      }

      // Lật thẻ thứ nhất
      if (selectedCardIds.length === 0) {
        const nextCards = current.cards.map((card) =>
          card.id === cardId
            ? { ...card, isFlipped: true }
            : card,
        );

        setGame({
          ...current,
          cards: nextCards,
        });

        setSelectedCardIds([cardId]);

        return;
      }

      // Không cho chọn lại thẻ thứ nhất
      if (selectedCardIds.includes(cardId)) {
        return;
      }

      const firstCardId = selectedCardIds[0];

      const firstCard = current.cards.find(
        (card) => card.id === firstCardId,
      );

      if (!firstCard) return;

      const nextCards = current.cards.map((card) =>
        card.id === cardId
          ? { ...card, isFlipped: true }
          : card,
      );

      const nextMoves = current.moves + 1;

      const isMatch = firstCard.pairId === clickedCard.pairId;

      // Nếu ghép đúng
      if (isMatch) {
        const matchedCards = nextCards.map((card) =>
          card.id === firstCardId || card.id === cardId
            ? {
                ...card,
                isFlipped: true,
                isMatched: true,
              }
            : card,
        );

        const nextMatchedPairs = current.matchedPairs + 1;

        const nextPlayers = current.players.map((player, index) =>
          index === current.currentPlayerIndex
            ? {
                ...player,
                score: player.score + 1,
              }
            : player,
        );

        const isFinished =
          nextMatchedPairs >= current.cards.length / 2;

        setGame({
          ...current,
          cards: matchedCards,
          players: nextPlayers,
          moves: nextMoves,
          matchedPairs: nextMatchedPairs,
          phase: isFinished ? "results" : "playing",
          elapsedSeconds: isFinished
            ? Math.floor((Date.now() - (current.startedAt ?? Date.now())) / 1000)
            : current.elapsedSeconds,
        });

        setSelectedCardIds([]);

        return;
      }

      // Nếu không khớp: hiển thị cả hai thẻ trong thời gian ngắn
      setGame({
        ...current,
        cards: nextCards,
        moves: nextMoves,
      });

      setSelectedCardIds([firstCardId, cardId]);
      setIsResolving(true);

      resolveTimeoutRef.current = setTimeout(() => {
        setGame((latest) => {
          if (latest.phase !== "playing") return latest;

          return {
            ...latest,
            cards: latest.cards.map((card) =>
              card.id === firstCardId || card.id === cardId
                ? {
                    ...card,
                    isFlipped: false,
                  }
                : card,
            ),
            currentPlayerIndex:
              (latest.currentPlayerIndex + 1) % latest.players.length,
          };
        });

        setSelectedCardIds([]);
        setIsResolving(false);
        resolveTimeoutRef.current = null;
      }, 900);
    },
    [isResolving, selectedCardIds],
  );

  if (game.phase === "setup") {
    if (!startRoute) return <MemorySetup onStart={handleSetupStart} />;
    if (!startRouteReady) {
      return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-slate-600"><span className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 font-semibold shadow-sm"><Loader2 className="animate-spin text-blue-600" />Đang mở ván chơi...</span></main>;
    }
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-4 text-center"><div className="rounded-2xl border border-white bg-white p-6 shadow-xl shadow-blue-100"><h1 className="text-2xl font-black text-slate-900">Chưa có ván Lật thẻ ghi nhớ để mở</h1><p className="mt-2 text-sm text-slate-500">Hãy quay lại thiết lập để bắt đầu một ván mới.</p><Link href="/games/memory" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"><ArrowLeft size={17} />Về thiết lập</Link></div></main>;
  }

  if (game.phase === "results") {
    return (
      <MemoryResults
        players={game.players}
        moves={game.moves}
        elapsedSeconds={game.elapsedSeconds}
        totalPairs={game.matchedPairs}
        onPlayAgain={playAgain}
        onBackToSetup={resetGame}
      />
    );
  }

  const totalPairs = game.cards.length / 2;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f8ff] px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-blue-200/50 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-blue-200/40 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
          <div>
            <Link href="/games" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-blue-700"><ArrowLeft size={15} />Quay lại trò chơi</Link>
            <p className="text-sm font-bold text-blue-600">
              PARTY PLAY · LẬT THẺ GHI NHỚ
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              Lật thẻ ghi nhớ
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {game.settings.mode === "icons"
                ? "Tìm hai thẻ có cùng biểu tượng."
                : "Ghép từ tiếng Anh với nghĩa tiếng Việt."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm(
                "Bạn có chắc muốn kết thúc ván chơi và quay lại thiết lập?",
              );

              if (confirmed) resetGame();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600"
          >
            Thoát trò chơi
          </button>
        </div>

        {/* Bảng điểm */}
        <div className="mb-6">
          <MemoryScoreboard
            players={game.players}
            currentPlayerIndex={game.currentPlayerIndex}
            moves={game.moves}
            matchedPairs={game.matchedPairs}
            totalPairs={totalPairs}
            elapsedSeconds={game.elapsedSeconds}
          />
        </div>

        {/* Thông báo lượt chơi */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
              🎮
            </div>

            <div>
              <p className="text-xs font-medium text-blue-600">
                Lượt của
              </p>

              <p className="font-bold text-slate-900">
                {game.players[game.currentPlayerIndex]?.name}
              </p>
            </div>
          </div>

          <p className="text-sm text-blue-700">
            {isResolving
              ? "Hai thẻ chưa khớp. Chuẩn bị chuyển lượt..."
              : selectedCardIds.length === 1
                ? "Hãy chọn thêm một thẻ."
                : "Hãy chọn hai thẻ để tìm cặp giống nhau."}
          </p>
        </div>

        {/* Bàn chơi */}
        <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-xl shadow-blue-100/60 backdrop-blur sm:p-6 md:p-6">
          <MemoryBoard
            cards={game.cards}
            difficulty={game.settings.difficulty}
            disabled={isResolving}
            onCardClick={handleCardClick}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span>🎯 Ghép đúng: +1 điểm</span>
          <span>🔄 Ghép sai: chuyển lượt</span>
          <span>🏆 Điểm cao nhất sẽ chiến thắng</span>
        </div>
      </div>
    </main>
  );
}
