"use client";

import type { MemoryCardState } from "@/types/memory";
import { Brain, Check } from "lucide-react";

interface MemoryCardProps {
  card: MemoryCardState;
  disabled: boolean;
  onClick: (cardId: string) => void;
}

export default function MemoryCard({
  card,
  disabled,
  onClick,
}: MemoryCardProps) {
  const isVisible = card.isFlipped || card.isMatched;

  return (
    <button
      type="button"
      onClick={() => onClick(card.id)}
      disabled={disabled || isVisible}
      aria-label={
        isVisible
          ? `Thẻ ${card.content}${card.matchContent ? `, ${card.matchContent}` : ""}`
          : "Lật thẻ"
      }
      className={`
        group relative aspect-[4/5] w-full
        rounded-2xl outline-none
        transition-transform duration-200
        focus-visible:ring-4 focus-visible:ring-violet-300
        ${
          card.isMatched
            ? "cursor-default"
            : disabled
              ? "cursor-not-allowed"
              : "cursor-pointer hover:-translate-y-1"
        }
      `}
    >
      <div
        className={`
          relative h-full w-full
          transition-transform duration-500
          [transform-style:preserve-3d]
          ${isVisible ? "[transform:rotateY(180deg)]" : ""}
        `}
      >
        {/* Mặt úp */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-slate-900 via-violet-900 to-fuchsia-800 shadow-lg [backface-visibility:hidden]"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full border-[12px] border-fuchsia-200" />
            <div className="absolute -bottom-7 -left-5 h-24 w-24 rounded-full border-[12px] border-violet-200" />
          </div>

          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur sm:h-14 sm:w-14"><Brain size={26} /></span>
          <span className="relative mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 sm:text-[10px]">Memory</span>
        </div>

        {/* Mặt ngửa */}
        <div
          className={`
            absolute inset-0 flex flex-col items-center justify-center
            overflow-hidden rounded-2xl border-2 p-2
            shadow-md
            [backface-visibility:hidden]
            [transform:rotateY(180deg)]
            ${card.isMatched ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50" : "border-violet-100 bg-gradient-to-br from-white to-violet-50"}
          `}
        >
          {card.type === "icon" ? (
              <span className="text-3xl drop-shadow-sm sm:text-4xl md:text-5xl">
              {card.content}
            </span>
          ) : (
            <>
              <span className="break-words px-1 text-center text-sm font-extrabold text-slate-800 sm:text-base md:text-lg">
                {card.content}
              </span>

              {card.matchContent && (
                <span className="mt-1 text-center text-[10px] text-slate-400 sm:text-xs">
                  {card.matchContent}
                </span>
              )}
            </>
          )}

          {card.isMatched && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check size={13} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
