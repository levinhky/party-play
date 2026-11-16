"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import SentenceSetup from "@/components/games/sentence-scramble/SentenceSetup";
import SentencePlay from "@/components/games/sentence-scramble/SentencePlay";
import SentenceResults from "@/components/games/sentence-scramble/SentenceResults";
import SentencePaper from "@/components/games/sentence-scramble/SentencePaper";

import { sentenceQuestions } from "@/data/sentenceScramble";

import type {
  SentenceGameState,
  SentenceQuestion,
  SentenceSettings,
} from "@/types/sentence-scramble";

const ACTIVE_GAME_KEY = "party-play-sentence-scramble-active-game";

interface SentenceGameProps {
  startRoute?: boolean;
}

function isSentenceSettings(value: unknown): value is SentenceSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<SentenceSettings>;
  return (settings.mode === "individual" || settings.mode === "team")
    && (settings.playStyle === "interactive" || settings.playStyle === "paper")
    && ["easy", "medium", "hard"].includes(settings.difficulty ?? "")
    && ["default", "custom", "combined"].includes(settings.questionSource ?? "")
    && typeof settings.totalQuestions === "number"
    && settings.totalQuestions > 0
    && Array.isArray(settings.customSentences)
    && Array.isArray(settings.playerNames)
    && Array.isArray(settings.teams);
}

function shuffleQuestions(questions: SentenceQuestion[]) {
  const result = [...questions];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createQuestions(settings: SentenceSettings) {
  const defaultPool = sentenceQuestions.filter(
    (question) => question.difficulty === settings.difficulty,
  );
  const customPool: SentenceQuestion[] = settings.customSentences.map((sentence, index) => ({
    id: `custom-${index}`,
    sentence,
    translation: "",
    difficulty: settings.difficulty,
    category: "Tự tạo",
    hint: "",
  }));
  const pool = settings.questionSource === "custom"
    ? customPool
    : settings.questionSource === "combined"
      ? [...defaultPool, ...customPool]
      : defaultPool;

  const shuffled = shuffleQuestions(pool);
  if (shuffled.length === 0) return [];

  // Nếu số câu yêu cầu lớn hơn số câu trong kho, cho phép chơi lại
  // các câu bằng cách xáo trộn lại thứ tự.
  const result: SentenceQuestion[] = [];

  while (result.length < settings.totalQuestions) {
    const batch = shuffleQuestions(shuffled);
    for (const question of batch) {
      result.push({ ...question, id: `${question.id}-copy-${result.length}` });
      if (result.length >= settings.totalQuestions) break;
    }
  }

  return result.slice(0, settings.totalQuestions);
}

export default function SentenceGame({ startRoute = false }: SentenceGameProps) {
  const router = useRouter();
  const [game, setGame] = useState<SentenceGameState | null>(null);
  const [startRouteReady, setStartRouteReady] = useState(!startRoute);

  const startGame = useCallback((settings: SentenceSettings) => {
    const questions = createQuestions(settings);

    const initialScores: Record<string, number> = {};

    if (settings.mode === "team") {
      settings.teams.forEach((team) => {
        initialScores[team.id] = 0;
      });
    } else {
      settings.playerNames.forEach((name, index) => {
        initialScores[`player-${index}`] = 0;
      });
    }

    const initialGame: SentenceGameState = {
      phase: settings.playStyle === "paper" ? "paper" : "playing",
      settings,
      questions,
      currentQuestionIndex: 0,
      selectedWords: [],
      availableWords: [],
      scores: initialScores,
      currentPlayerIndex: 0,
      correctCount: 0,
      hintCount: 0,
      wrongAttempts: 0,
    };

    setGame(initialGame);
  }, []);

  const handleSetupStart = useCallback((settings: SentenceSettings) => {
    try {
      sessionStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(settings));
      navigateWithLoading(() => router.push("/games/sentence-scramble/start"));
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
        if (isSentenceSettings(settings)) startGame(settings);
      } catch (error) {
        console.error("Unable to restore Sentence Scramble settings:", error);
      } finally {
        setStartRouteReady(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [startGame, startRoute]);

  const activeTeams = useMemo(() => {
    if (!game || game.settings.mode !== "team") return [];

    return game.settings.teams.map((team) => ({
      ...team,
      score: game.scores[team.id] ?? 0,
    }));
  }, [game]);

  const currentPlayerName = useMemo(() => {
    if (!game) return "";

    if (game.settings.mode === "team") {
      return (
        game.settings.teams[game.currentPlayerIndex % game.settings.teams.length]
          ?.name ?? "Đội chơi"
      );
    }

    return (
      game.settings.playerNames[
        game.currentPlayerIndex % game.settings.playerNames.length
      ] ?? "Người chơi"
    );
  }, [game]);

  const currentScore = useMemo(() => {
    if (!game) return 0;

    if (game.settings.mode === "team") {
      const currentTeam =
        game.settings.teams[
          game.currentPlayerIndex % game.settings.teams.length
        ];

      return currentTeam ? game.scores[currentTeam.id] ?? 0 : 0;
    }

    const playerId = `player-${
      game.currentPlayerIndex % game.settings.playerNames.length
    }`;

    return game.scores[playerId] ?? 0;
  }, [game]);

  const handleCorrect = useCallback(
    (usedHint: boolean) => {
      setGame((current) => {
        if (!current || current.phase !== "playing") return current;

        const playerIndex =
          current.currentPlayerIndex %
          (current.settings.mode === "team"
            ? current.settings.teams.length
            : current.settings.playerNames.length);

        const scoreKey =
          current.settings.mode === "team"
            ? current.settings.teams[playerIndex]?.id
            : `player-${playerIndex}`;

        if (!scoreKey) return current;

        const points = usedHint ? 5 : 10;

        return {
          ...current,
          scores: {
            ...current.scores,
            [scoreKey]: (current.scores[scoreKey] ?? 0) + points,
          },
          correctCount: current.correctCount + 1,
          hintCount: current.hintCount + (usedHint ? 1 : 0),
        };
      });
    },
    [],
  );

  const handleNext = useCallback(() => {
    setGame((current) => {
      if (!current || current.phase !== "playing") return current;

      const nextQuestionIndex = current.currentQuestionIndex + 1;
      const totalQuestions = current.questions.length;

      if (nextQuestionIndex >= totalQuestions) {
        return {
          ...current,
          phase: "results",
          currentQuestionIndex: nextQuestionIndex - 1,
        };
      }

      const playerCount =
        current.settings.mode === "team"
          ? current.settings.teams.length
          : current.settings.playerNames.length;

      return {
        ...current,
        currentQuestionIndex: nextQuestionIndex,
        currentPlayerIndex: (current.currentPlayerIndex + 1) % playerCount,
      };
    });
  }, []);

  const handleBack = useCallback(() => {
    setGame(null);
    if (startRoute) {
      try {
        sessionStorage.removeItem(ACTIVE_GAME_KEY);
      } catch {
        // Continue route navigation if browser storage is unavailable.
      }
      navigateWithLoading(() => router.push("/games/sentence-scramble"));
    }
  }, [router, startRoute]);

  const handleRestart = useCallback(() => {
    setGame((current) => {
      if (!current) return current;

      const settings = current.settings;
      const questions = createQuestions(settings);
      const scores: Record<string, number> = {};

      if (settings.mode === "team") {
        settings.teams.forEach((team) => {
          scores[team.id] = 0;
        });
      } else {
        settings.playerNames.forEach((_, index) => {
          scores[`player-${index}`] = 0;
        });
      }

      return {
        ...current,
        phase: settings.playStyle === "paper" ? "paper" : "playing",
        questions,
        currentQuestionIndex: 0,
        currentPlayerIndex: 0,
        selectedWords: [],
        availableWords: [],
        scores,
        correctCount: 0,
        hintCount: 0,
        wrongAttempts: 0,
      };
    });
  }, []);

  if (!game) {
    if (!startRoute) return <SentenceSetup onStart={handleSetupStart} />;
    if (!startRouteReady) {
      return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-slate-600"><span className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 font-semibold shadow-sm"><Loader2 className="animate-spin text-blue-600" />Đang mở ván chơi...</span></main>;
    }
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-4 text-center"><div className="rounded-2xl border border-white bg-white p-6 shadow-xl shadow-blue-100"><h1 className="text-2xl font-black text-slate-900">Chưa có ván Sắp xếp câu để mở</h1><p className="mt-2 text-sm text-slate-500">Hãy quay lại thiết lập để bắt đầu một ván mới.</p><Link href="/games/sentence-scramble" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"><ArrowLeft size={17} />Về thiết lập</Link></div></main>;
  }

  if (game.phase === "paper") {
    return <SentencePaper questions={game.questions} onBack={handleBack} />;
  }

  if (game.phase === "results") {
    const totalScore = Object.values(game.scores).reduce(
      (sum, score) => sum + score,
      0,
    );

    return (
      <SentenceResults
        score={totalScore}
        correctCount={game.correctCount}
        totalQuestions={game.questions.length}
        hintCount={game.hintCount}
        wrongAttempts={game.wrongAttempts}
        isTeamMode={game.settings.mode === "team"}
        teams={activeTeams}
        onRestart={handleRestart}
        onBack={handleBack}
      />
    );
  }

  const currentQuestion = game.questions[game.currentQuestionIndex];

  if (!currentQuestion) {
    return null;
  }

  return (
    <SentencePlay
      key={`${currentQuestion.id}-${game.currentQuestionIndex}`}
      question={currentQuestion}
      questionNumber={game.currentQuestionIndex + 1}
      totalQuestions={game.questions.length}
      currentPlayerName={currentPlayerName}
      currentScore={currentScore}
      isTeamMode={game.settings.mode === "team"}
      teams={activeTeams}
      onCorrect={handleCorrect}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}   
