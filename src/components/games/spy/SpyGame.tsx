"use client";

import { useCallback, useState } from "react";

import type {
  SpyGameState,
  SpyPlayer,
  SpyRole,
  SpySettings,
  SpyVote,
  SpyWordPair,
  SpyRoundResult,
} from "@/types/spy";

import { spyWordPairs } from "@/data/spyWords";

import SpySetup from "./SpySetup";
import SpyPassDevice from "./SpyPassDevice";
import SpyRoleReveal from "./SpyRoleReveal";
import SpyDiscussion from "./SpyDiscussion";
import SpyVoting from "./SpyVoting";
import SpyVoteResults from "./SpyVoteResults";
import SpyGuessWord from "./SpyGuessWord";
import SpyResults from "./SpyResults";
import SpyPlayerStatus from "./SpyPlayerStatus";
import SpyElimination from "./SpyElimination";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Lấy danh sách từ khóa dựa trên cấu hình người chơi.
 */
function getWordPool(settings: SpySettings): SpyWordPair[] {
  const defaultWords = spyWordPairs;
  const customWords = settings.customWordPairs ?? [];

  let availableWords: SpyWordPair[];

  switch (settings.wordSource ?? "default") {
    case "custom":
      availableWords = [...customWords];
      break;

    case "all":
      availableWords = [...defaultWords, ...customWords];
      break;

    case "default":
    default:
      availableWords = [...defaultWords];
      break;
  }

  if (settings.category !== "Tất cả chủ đề") {
    availableWords = availableWords.filter(
      (pair) => pair.category === settings.category,
    );
  }

  return availableWords;
}

/**
 * Chọn ngẫu nhiên một cặp từ phù hợp.
 */
function getRandomWordPair(settings: SpySettings): SpyWordPair {
  let availableWords = getWordPool(settings);

  // Nếu chủ đề được chọn không có từ phù hợp,
  // thử lại với toàn bộ nguồn từ đã chọn.
  if (availableWords.length === 0) {
    const fallbackSettings: SpySettings = {
      ...settings,
      category: "Tất cả chủ đề",
    };

    availableWords = getWordPool(fallbackSettings);
  }

  if (availableWords.length === 0) {
    throw new Error(
      "Không tìm thấy cặp từ khóa. Vui lòng kiểm tra danh sách từ khóa hoặc chọn nguồn từ khác.",
    );
  }

  const randomIndex = Math.floor(Math.random() * availableWords.length);

  return availableWords[randomIndex];
}

/**
 * Chuẩn hóa và kiểm tra cấu hình trước khi tạo ván.
 */
function normalizeSettings(settings: SpySettings): SpySettings {
  const playerNames = settings.playerNames
    .map((name) => name.trim())
    .filter(Boolean);

  const maxSpyCount = Math.max(1, Math.floor(playerNames.length / 3));

  const spyCount = Math.min(
    Math.max(1, Math.floor(settings.spyCount)),
    maxSpyCount,
  );

  return {
    ...settings,
    playerNames,
    spyCount,
    wordSource: settings.wordSource ?? "default",
    customWordPairs: settings.customWordPairs ?? [],
  };
}

/**
 * Chia vai trò cho người chơi.
 */
function assignRoles(
  basePlayers: SpyPlayer[],
  settings: SpySettings,
  wordPair: SpyWordPair,
): SpyPlayer[] {
  const spyCount = Math.min(
    Math.max(1, settings.spyCount),
    Math.max(1, Math.floor(basePlayers.length / 3)),
  );

  const spyIndexes = new Set(
    shuffle(basePlayers.map((_, index) => index)).slice(0, spyCount),
  );

  return basePlayers.map((player, index) => {
    const isSpy = spyIndexes.has(index);

    return {
      ...player,
      role: isSpy ? "spy" : "civilian",
      word:
        isSpy && settings.mode === "no-word"
          ? null
          : isSpy
            ? wordPair.spyWord
            : wordPair.word,
      isEliminated: false,
      votesReceived: 0,
    };
  });
}

/**
 * Tạo trạng thái ban đầu cho một ván mới.
 */
function createInitialState(settings: SpySettings): SpyGameState {
  const normalizedSettings = normalizeSettings(settings);

  if (normalizedSettings.playerNames.length < 4) {
    throw new Error("Cần ít nhất 4 người chơi để bắt đầu.");
  }

  if (
    normalizedSettings.wordSource === "custom" &&
    (normalizedSettings.customWordPairs?.length ?? 0) === 0
  ) {
    throw new Error("Bạn chưa có cặp từ khóa tùy chỉnh nào.");
  }

  const wordPair = getRandomWordPair(normalizedSettings);

  const basePlayers: SpyPlayer[] = normalizedSettings.playerNames.map(
    (name, index) => ({
      id: `player-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      role: "civilian",
      word: null,
      isEliminated: false,
      wins: 0,
    }),
  );

  const players = assignRoles(basePlayers, normalizedSettings, wordPair);

  const scores = Object.fromEntries(players.map((player) => [player.id, 0]));

  return {
    phase: "pass-device",
    players,
    currentPlayerIndex: 0,
    currentRound: 1,
    wordPair,
    settings: normalizedSettings,
    winner: null,
    votes: [],
    voteHistory: [],
    eliminatedPlayerId: null,
    tiedPlayerIds: [],
    guessPlayerId: null,
    roundResults: [],
    scores,
    guessCorrect: null,
    discussionSession: 0,
    votingAttempt: 0,
  };
}

/**
 * Tạo trạng thái kết thúc ván và cộng điểm cho phe chiến thắng.
 */
function buildGameResult(
  previous: SpyGameState,
  winner: SpyRole,
  eliminatedPlayerId: string | null,
  players: SpyPlayer[],
  guessCorrect: boolean | null = null,
): SpyGameState {
  if (!previous.wordPair) return previous;

  const updatedScores = { ...previous.scores };

  players.forEach((player) => {
    if (player.role === winner) {
      updatedScores[player.id] =
        (updatedScores[player.id] ?? 0) + (winner === "spy" ? 2 : 1);
    }
  });

  const result: SpyRoundResult = {
    round: 1,
    winner,
    eliminatedPlayerId,
    guessCorrect: guessCorrect ?? undefined,
    wordPair: previous.wordPair,
    players: players.map((player) => ({ ...player })),
  };

  return {
    ...previous,
    phase: "game-results",
    players,
    winner,
    eliminatedPlayerId,
    guessCorrect,
    scores: updatedScores,
    roundResults: [result],
  };
}

/**
 * Kiểm tra phiếu bầu có hợp lệ hay không.
 * Mỗi người chơi còn hoạt động phải có đúng một phiếu.
 */
function validateVotes(players: SpyPlayer[], votes: SpyVote[]): boolean {
  const activePlayers = players.filter((player) => !player.isEliminated);

  const activePlayerIds = new Set(activePlayers.map((player) => player.id));

  const uniqueVoters = new Set<string>();

  for (const vote of votes) {
    if (
      !activePlayerIds.has(vote.voterId) ||
      !activePlayerIds.has(vote.targetId) ||
      vote.voterId === vote.targetId ||
      uniqueVoters.has(vote.voterId)
    ) {
      return false;
    }

    uniqueVoters.add(vote.voterId);
  }

  return uniqueVoters.size === activePlayers.length;
}

/**
 * Đếm phiếu và trả về danh sách người có số phiếu cao nhất.
 */
function getHighestVotedPlayers(votes: SpyVote[]): {
  maxVotes: number;
  playerIds: string[];
} {
  const counts: Record<string, number> = {};

  votes.forEach((vote) => {
    counts[vote.targetId] = (counts[vote.targetId] ?? 0) + 1;
  });

  const maxVotes = Math.max(0, ...Object.values(counts));

  if (maxVotes === 0) {
    return {
      maxVotes: 0,
      playerIds: [],
    };
  }

  return {
    maxVotes,
    playerIds: Object.entries(counts)
      .filter(([, count]) => count === maxVotes)
      .map(([playerId]) => playerId),
  };
}

export default function SpyGame() {
  const [game, setGame] = useState<SpyGameState | null>(null);

  // Bắt đầu ván mới.
  const startGame = useCallback((settings: SpySettings) => {
    try {
      setGame(createInitialState(settings));
    } catch (error) {
      console.error("Cannot start Spy Game:", error);

      window.alert(
        error instanceof Error ? error.message : "Không thể bắt đầu trò chơi.",
      );
    }
  }, []);

  // Chuyển thiết bị sang người chơi tiếp theo.
  const nextPlayer = useCallback(() => {
    setGame((previous) => {
      if (!previous || previous.phase !== "reveal") {
        return previous;
      }

      const nextIndex = previous.currentPlayerIndex + 1;

      if (nextIndex >= previous.players.length) {
        return {
          ...previous,
          phase: "discussion",
          currentPlayerIndex: 0,
          discussionSession: previous.discussionSession + 1,
        };
      }

      return {
        ...previous,
        phase: "pass-device",
        currentPlayerIndex: nextIndex,
      };
    });
  }, []);

  // Bắt đầu bỏ phiếu.
  const startVoting = useCallback(() => {
    setGame((previous) => {
      if (!previous || previous.phase !== "discussion") {
        return previous;
      }

      return {
        ...previous,
        phase: "voting",
        votes: [],
        tiedPlayerIds: [],
        votingAttempt: previous.votingAttempt + 1,
      };
    });
  }, []);

  // Lưu phiếu bầu.
  const submitVotes = useCallback((votes: SpyVote[]) => {
    setGame((previous) => {
      if (!previous || previous.phase !== "voting") {
        return previous;
      }

      if (!validateVotes(previous.players, votes)) {
        return previous;
      }

      // Chỉ chấp nhận mục tiêu hợp lệ trong lượt bỏ phiếu lại.
      if (previous.tiedPlayerIds.length > 0) {
        const allowedTargets = new Set(previous.tiedPlayerIds);

        const invalidTarget = votes.some(
          (vote) => !allowedTargets.has(vote.targetId),
        );

        if (invalidTarget) return previous;
      }

      return {
        ...previous,
        votes: [...votes],
        voteHistory: [
          ...previous.voteHistory,
          {
            attempt: previous.votingAttempt,
            votes: [...votes],
            tiedPlayerIds: [...previous.tiedPlayerIds],
            eliminatedPlayerId: null,
          },
        ],
        phase: "vote-results",
      };
    });
  }, []);

  // Xử lý kết quả bỏ phiếu.
  const continueAfterVote = useCallback((_tiedPlayerIds: string[]) => {
    setGame((previous) => {
      if (!previous || previous.phase !== "vote-results") {
        return previous;
      }

      // Kiểm tra lại toàn bộ phiếu trước khi xử lý.
      if (!validateVotes(previous.players, previous.votes)) {
        return {
          ...previous,
          phase: "discussion",
          votes: [],
          tiedPlayerIds: [],
          discussionSession: previous.discussionSession + 1,
        };
      }

      const activePlayers = previous.players.filter(
        (player) => !player.isEliminated,
      );

      const activePlayerIds = new Set(activePlayers.map((player) => player.id));

      const validVotes = previous.votes.filter(
        (vote) =>
          activePlayerIds.has(vote.voterId) &&
          activePlayerIds.has(vote.targetId) &&
          vote.voterId !== vote.targetId,
      );

      const { maxVotes, playerIds: highestVotedIds } =
        getHighestVotedPlayers(validVotes);

      if (maxVotes === 0 || highestVotedIds.length === 0) {
        return {
          ...previous,
          phase: "discussion",
          votes: [],
          tiedPlayerIds: [],
          discussionSession: previous.discussionSession + 1,
        };
      }

      // Nếu hòa, chỉ mở lại bỏ phiếu giữa những người có số phiếu cao nhất.
      if (highestVotedIds.length > 1) {
        return {
          ...previous,
          phase: "voting",
          votes: [],
          tiedPlayerIds: highestVotedIds,
          votingAttempt: previous.votingAttempt + 1,
        };
      }

      const eliminatedId = highestVotedIds[0];

      const eliminatedPlayer = activePlayers.find(
        (player) => player.id === eliminatedId,
      );

      if (!eliminatedPlayer) return previous;

      // Cập nhật người bị loại.
      const updatedPlayers = previous.players.map((player) =>
        player.id === eliminatedId ? { ...player, isEliminated: true } : player,
      );

      // Cập nhật lịch sử bỏ phiếu.
      const updatedVoteHistory = previous.voteHistory.map((round, index) =>
        index === previous.voteHistory.length - 1
          ? {
              ...round,
              eliminatedPlayerId: eliminatedId,
            }
          : round,
      );

      const remainingPlayers = updatedPlayers.filter(
        (player) => !player.isEliminated,
      );

      const remainingSpies = remainingPlayers.filter(
        (player) => player.role === "spy",
      ).length;

      const remainingCivilians = remainingPlayers.filter(
        (player) => player.role === "civilian",
      ).length;

      // Gián điệp cuối cùng bị loại: cho cơ hội đoán từ khóa.
      if (eliminatedPlayer.role === "spy" && remainingSpies === 0) {
        return {
          ...previous,
          players: updatedPlayers,
          eliminatedPlayerId: eliminatedId,
          guessPlayerId: eliminatedId,
          votes: [],
          voteHistory: updatedVoteHistory,
          tiedPlayerIds: [],
          phase: "guess-word",
        };
      }

      // Gián điệp thắng nếu số lượng còn lại >= dân thường.
      if (remainingSpies > 0 && remainingSpies >= remainingCivilians) {
        return buildGameResult(
          {
            ...previous,
            voteHistory: updatedVoteHistory,
          },
          "spy",
          eliminatedId,
          updatedPlayers,
        );
      }

      // Chưa có phe nào thắng: tiếp tục thảo luận.
      return {
        ...previous,
        players: updatedPlayers,
        eliminatedPlayerId: eliminatedId,
        phase: "elimination",
        votes: [],
        voteHistory: updatedVoteHistory,
        tiedPlayerIds: [],
      };
    });
  }, []);

  // Xử lý khi gián điệp đoán từ khóa.
  const handleGuess = useCallback((correct: boolean) => {
    setGame((previous) => {
      if (!previous || previous.phase !== "guess-word") {
        return previous;
      }

      const winner: SpyRole = correct ? "spy" : "civilian";

      return buildGameResult(
        previous,
        winner,
        previous.eliminatedPlayerId,
        previous.players,
        correct,
      );
    });
  }, []);

  // Chia ván mới: giữ nguyên cấu hình, tạo vai trò và từ khóa mới.
  const playAgain = useCallback(() => {
    setGame((previous) => {
      if (!previous) return previous;

      try {
        return createInitialState(previous.settings);
      } catch (error) {
        console.error("Cannot restart Spy Game:", error);

        return null;
      }
    });
  }, []);

  // Quay về setup để thay đổi danh sách người chơi và cài đặt.
  const backToSetup = useCallback(() => {
    setGame(null);
  }, []);

  // Tiếp tục sau khi một người bị loại.
  const continueAfterElimination = useCallback(() => {
    setGame((previous) => {
      if (!previous || previous.phase !== "elimination") {
        return previous;
      }

      return {
        ...previous,
        phase: "discussion",
        discussionSession: previous.discussionSession + 1,
      };
    });
  }, []);

  if (!game) {
    return <SpySetup onStart={startGame} />;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];

  switch (game.phase) {
    case "pass-device":
      if (!currentPlayer) {
        return <SpySetup onStart={startGame} />;
      }

      return (
        <SpyPassDevice
          playerName={currentPlayer.name}
          playerNumber={game.currentPlayerIndex + 1}
          totalPlayers={game.players.length}
          onReady={() => {
            setGame((previous) =>
              previous?.phase === "pass-device"
                ? {
                    ...previous,
                    phase: "reveal",
                  }
                : previous,
            );
          }}
        />
      );

    case "reveal":
      if (!currentPlayer) {
        return <SpySetup onStart={startGame} />;
      }

      return (
        <SpyRoleReveal
          player={currentPlayer}
          playerNumber={game.currentPlayerIndex + 1}
          totalPlayers={game.players.length}
          onConfirm={nextPlayer}
        />
      );

    case "discussion":
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
          <SpyPlayerStatus players={game.players} />

          <SpyDiscussion
            key={`discussion-${game.discussionSession}`}
            playerNames={game.players
              .filter((player) => !player.isEliminated)
              .map((player) => player.name)}
            minutes={game.settings.discussionMinutes}
            onFinish={startVoting}
          />
        </div>
      );

    case "voting":
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
          <SpyPlayerStatus players={game.players} />

          <SpyVoting
            key={`voting-${game.votingAttempt}`}
            players={game.players}
            tiedPlayerIds={game.tiedPlayerIds}
            onSubmit={submitVotes}
          />
        </div>
      );

    case "vote-results":
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
          <SpyPlayerStatus players={game.players} />

          <SpyVoteResults
            players={game.players}
            votes={game.votes}
            onContinue={continueAfterVote}
          />
        </div>
      );

    case "elimination": {
      const eliminatedPlayer = game.players.find(
        (player) => player.id === game.eliminatedPlayerId,
      );

      if (!eliminatedPlayer) {
        return <SpySetup onStart={startGame} />;
      }

      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
          <SpyPlayerStatus players={game.players} />

          <SpyElimination
            player={eliminatedPlayer}
            remainingPlayers={
              game.players.filter((player) => !player.isEliminated).length
            }
            onContinue={continueAfterElimination}
          />
        </div>
      );
    }

    case "guess-word": {
      const guessPlayer = game.players.find(
        (player) => player.id === game.guessPlayerId,
      );

      return (
        <SpyGuessWord
          spyName={guessPlayer?.name ?? "Điệp viên"}
          secretWord={game.wordPair?.word ?? ""}
          onGuess={handleGuess}
        />
      );
    }

    case "game-results":
      return (
        <SpyResults
          players={game.players}
          wordPair={game.wordPair}
          mode={game.settings.mode}
          winner={game.winner}
          scores={game.scores}
          roundResults={game.roundResults}
          voteHistory={game.voteHistory}
          onPlayAgain={playAgain}
          onBackToSetup={backToSetup}
        />
      );

    default:
      return <SpySetup onStart={startGame} />;
  }
}
