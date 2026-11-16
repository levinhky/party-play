"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import TabooSetup from "@/components/games/taboo/TabooSetup";
import TabooTurn from "@/components/games/taboo/TabooTurn";
import TabooResults from "@/components/games/taboo/TabooResults";
import TabooScoreboard from "@/components/games/taboo/TabooScoreboard";
import type {
  TabooCardData,
  TabooGameState,
  TabooSettings,
} from "@/types/taboo";

const ACTIVE_GAME_KEY = "party-play-taboo-active-game";

interface TabooGameProps {
  startRoute?: boolean;
}

function isTabooSettings(value: unknown): value is TabooSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<TabooSettings>;
  return (settings.mode === "individual" || settings.mode === "teams")
    && Array.isArray(settings.teams)
    && settings.teams.length > 0
    && Array.isArray(settings.cards)
    && settings.cards.length > 0
    && [30, 60, 90].includes(settings.turnDuration ?? 0)
    && typeof settings.rounds === "number"
    && settings.rounds > 0;
}

function shuffleCards(cards: TabooCardData[]) {
  const result = [...cards];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createGameCards(cards: TabooCardData[]): TabooCardData[] {
  return shuffleCards(cards);
}

export default function TabooGame({ startRoute = false }: TabooGameProps) {
  const router = useRouter();
  const [game, setGame] = useState<TabooGameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startRouteReady, setStartRouteReady] = useState(!startRoute);

  const gameRef = useRef<TabooGameState | null>(null);
  const timeLeftRef = useRef(0);
  const turnIdRef = useRef(0);
  const turnEndedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncGame = useCallback((nextGame: TabooGameState) => {
    gameRef.current = nextGame;
    setGame(nextGame);
  }, []);

  const syncTime = useCallback((seconds: number) => {
    timeLeftRef.current = seconds;
    setTimeLeft(seconds);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const beginGame = useCallback(
    (settings: TabooSettings) => {
      stopTimer();

      const initialGame: TabooGameState = {
        phase: "playing",
        teams: settings.teams.map((team) => ({
          ...team,
          score: 0,
        })),
        cards: createGameCards(settings.cards),
        currentTeamIndex: 0,
        currentRound: 1,
        currentCardIndex: 0,
        turnDuration: settings.turnDuration,
        timeLeft: settings.turnDuration,
        correctCount: 0,
        skippedCount: 0,
        forbiddenCount: 0,
        settings,
      };

      turnIdRef.current += 1;
      turnEndedRef.current = false;

      syncTime(settings.turnDuration);
      syncGame(initialGame);
    },
    [stopTimer, syncGame, syncTime],
  );

  const handleSetupStart = useCallback((settings: TabooSettings) => {
    try {
      sessionStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(settings));
      navigateWithLoading(() => router.push("/games/taboo/start"));
    } catch {
      toast.error("Không thể lưu thiết lập trò chơi trên thiết bị này.");
    }
  }, [router]);

  useEffect(() => {
    if (!startRoute) return;
    const timer = setTimeout(() => {
      try {
        const rawSettings = sessionStorage.getItem(ACTIVE_GAME_KEY);
        const settings: unknown = rawSettings ? JSON.parse(rawSettings) : null;
        if (isTabooSettings(settings)) {
          beginGame(settings);
        }
      } catch (error) {
        console.error("Unable to restore Taboo settings:", error);
      } finally {
        setStartRouteReady(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [beginGame, startRoute]);

  const endTurn = useCallback(() => {
    const current = gameRef.current;

    if (!current || current.phase !== "playing" || turnEndedRef.current) {
      return;
    }

    turnEndedRef.current = true;
    stopTimer();

    const isLastTeam =
      current.currentTeamIndex === current.teams.length - 1;
    const isLastRound = current.currentRound >= current.settings.rounds;

    if (isLastTeam && isLastRound) {
      const finishedGame: TabooGameState = {
        ...current,
        phase: "results",
        timeLeft: 0,
      };

      syncTime(0);
      syncGame(finishedGame);
      toast.success("Trò chơi kết thúc!", {
        description: "Cùng xem kết quả chung cuộc nhé.",
      });
      return;
    }

    const nextTeamIndex = isLastTeam ? 0 : current.currentTeamIndex + 1;
    const nextRound = isLastTeam
      ? current.currentRound + 1
      : current.currentRound;

    const nextGame: TabooGameState = {
      ...current,
      currentTeamIndex: nextTeamIndex,
      currentRound: nextRound,
      timeLeft: current.turnDuration,
    };

    turnIdRef.current += 1;
    turnEndedRef.current = false;

    syncTime(current.turnDuration);
    syncGame(nextGame);

    toast.info("Hết lượt!", {
      description: `${current.settings.mode === "individual" ? "Người chơi" : "Đội"} ${current.teams[current.currentTeamIndex].name} đã kết thúc lượt.`,
    });
  }, [stopTimer, syncGame, syncTime]);

  // Timer chỉ chạy theo lượt của đội, không khởi động lại khi đổi từ khóa.
  useEffect(() => {
    if (game?.phase !== "playing") {
      stopTimer();
      return;
    }

    stopTimer();

    const activeTurnId = turnIdRef.current;

    timerRef.current = setInterval(() => {
      if (
        turnEndedRef.current ||
        turnIdRef.current !== activeTurnId
      ) {
        return;
      }

      const nextTime = Math.max(0, timeLeftRef.current - 1);
      syncTime(nextTime);

      const current = gameRef.current;

      if (current?.phase === "playing") {
        gameRef.current = {
          ...current,
          timeLeft: nextTime,
        };
        setGame(gameRef.current);
      }

      if (nextTime === 0) {
        endTurn();
      }
    }, 1000);

    return stopTimer;
  }, [game?.phase, game?.currentTeamIndex, game?.currentRound, endTurn, stopTimer, syncTime]);

  const moveToNextCard = useCallback(() => {
    const current = gameRef.current;

    if (!current || current.phase !== "playing" || turnEndedRef.current) {
      return;
    }

    let nextIndex = current.currentCardIndex + 1;
    let nextCards = current.cards;

    // Khi hết bộ thẻ, xáo lại để có thể tiếp tục chơi.
    if (nextIndex >= nextCards.length) {
      nextCards = createGameCards(current.settings.cards);
      nextIndex = 0;
    }

    syncGame({
      ...current,
      cards: nextCards,
      currentCardIndex: nextIndex,
      timeLeft: timeLeftRef.current,
    });
  }, [syncGame]);

  const handleCorrect = useCallback(() => {
    const current = gameRef.current;

    if (!current || current.phase !== "playing" || turnEndedRef.current) {
      return;
    }

    const team = current.teams[current.currentTeamIndex];

    const nextTeams = current.teams.map((item, index) =>
      index === current.currentTeamIndex
        ? { ...item, score: item.score + 1 }
        : item,
    );

    syncGame({
      ...current,
      teams: nextTeams,
      correctCount: current.correctCount + 1,
      timeLeft: timeLeftRef.current,
    });

    toast.success("Đoán đúng! +1 điểm", {
      description: `${current.settings.mode === "individual" ? "Người chơi" : "Đội"} ${team.name} tiếp tục lượt của mình.`,
      duration: 1200,
    });

    moveToNextCard();
  }, [moveToNextCard, syncGame]);

  const handleSkip = useCallback(() => {
    const current = gameRef.current;

    if (!current || current.phase !== "playing" || turnEndedRef.current) {
      return;
    }

    syncGame({
      ...current,
      skippedCount: current.skippedCount + 1,
      timeLeft: timeLeftRef.current,
    });

    toast.info("Đã bỏ qua từ khóa", {
      description: "Chuyển sang từ khóa tiếp theo.",
      duration: 1200,
    });

    moveToNextCard();
  }, [moveToNextCard, syncGame]);

  const handleForbidden = useCallback(() => {
    const current = gameRef.current;

    if (!current || current.phase !== "playing" || turnEndedRef.current) {
      return;
    }

    const team = current.teams[current.currentTeamIndex];

    const nextTeams = current.teams.map((item, index) =>
      index === current.currentTeamIndex
        ? { ...item, score: Math.max(0, item.score - 1) }
        : item,
    );

    syncGame({
      ...current,
      teams: nextTeams,
      forbiddenCount: current.forbiddenCount + 1,
      timeLeft: timeLeftRef.current,
    });

    toast.error("Phạm luật! -1 điểm", {
      description: `${current.settings.mode === "individual" ? "Người chơi" : "Đội"} ${team.name} bị trừ 1 điểm.`,
      duration: 1200,
    });

    moveToNextCard();
  }, [moveToNextCard, syncGame]);

  const handleRestart = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;

    beginGame(current.settings);
  }, [beginGame]);

  const handleBackToSetup = useCallback(() => {
    stopTimer();
    turnIdRef.current += 1;
    turnEndedRef.current = true;
    gameRef.current = null;
    setGame(null);
    syncTime(0);
    if (startRoute) {
      try {
        sessionStorage.removeItem(ACTIVE_GAME_KEY);
      } catch {
        // Route navigation should still work if browser storage is unavailable.
      }
      navigateWithLoading(() => router.push("/games/taboo"));
    }
  }, [router, startRoute, stopTimer, syncTime]);

  if (!game) {
    if (!startRoute) return <TabooSetup onStart={handleSetupStart} />;

    if (!startRouteReady) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-slate-600">
          <span className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 font-semibold shadow-sm">
            <Loader2 className="animate-spin text-blue-600" /> Đang mở ván chơi...
          </span>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-4 text-center">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-xl shadow-blue-100">
          <h1 className="text-2xl font-black text-slate-900">Chưa có ván Taboo để mở</h1>
          <p className="mt-2 text-sm text-slate-500">Hãy quay lại thiết lập để bắt đầu một ván mới.</p>
          <Link href="/games/taboo" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
            <ArrowLeft size={17} /> Về thiết lập
          </Link>
        </div>
      </main>
    );
  }

  if (game.phase === "results") {
    return (
      <TabooResults
        mode={game.settings.mode}
        teams={game.teams}
        rounds={game.settings.rounds}
        onPlayAgain={handleRestart}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  const currentCard = game.cards[game.currentCardIndex];
  const currentTeam = game.teams[game.currentTeamIndex];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f8ff] px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-blue-200/50 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-blue-200/40 blur-[100px]" />
      <div className="relative mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6">
        <div>
          <Link href="/games" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-blue-700">
            <ArrowLeft size={15} /> Quay lại trò chơi
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-500">Party Play · Taboo</p>
          <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Vòng chơi của bạn</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700">
          Vòng {game.currentRound}<span className="text-blue-300">/</span>{game.settings.rounds}
        </div>
      </header>
      <TabooScoreboard
        mode={game.settings.mode}
        teams={game.teams}
        currentTeamIndex={game.currentTeamIndex}
        currentRound={game.currentRound}
        totalRounds={game.settings.rounds}
      />

      {currentCard && (
        <TabooTurn
          key={`${game.currentRound}-${game.currentTeamIndex}-${game.currentCardIndex}`}
          card={currentCard}
          team={currentTeam}
          cardNumber={game.currentCardIndex + 1}
          totalCards={game.cards.length}
          turnDuration={game.turnDuration}
          timeLeft={timeLeft}
          onCorrect={handleCorrect}
          onSkip={handleSkip}
          onForbidden={handleForbidden}
        />
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleBackToSetup}
          className="rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          Thoát trò chơi
        </button>
      </div>
      </div>
    </main>
  );
}
