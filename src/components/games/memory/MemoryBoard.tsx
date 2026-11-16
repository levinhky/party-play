"use client";

import type { MemoryCardState, MemoryDifficulty } from "@/types/memory";
import MemoryCard from "@/components/games/memory/MemoryCard";

interface MemoryBoardProps {
  cards: MemoryCardState[];
  difficulty: MemoryDifficulty;
  disabled: boolean;
  onCardClick: (cardId: string) => void;
}

const gridColumns: Record<MemoryDifficulty, string> = {
  easy: "grid-cols-3 sm:grid-cols-4",
  medium: "grid-cols-4 sm:grid-cols-5",
  hard: "grid-cols-4 sm:grid-cols-5 lg:grid-cols-6",
};

export default function MemoryBoard({
  cards,
  difficulty,
  disabled,
  onCardClick,
}: MemoryBoardProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={`grid ${gridColumns[difficulty]} gap-2 sm:gap-3 md:gap-4`}>
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            disabled={disabled}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
