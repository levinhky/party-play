import Link from "next/link";
import { ArrowUpRight, Clock3, Users } from "lucide-react";
import type { Game } from "@/types/game";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link
      href={game.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/60"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl text-4xl transition duration-300 group-hover:rotate-3 group-hover:scale-105"
          style={{ backgroundColor: game.background }}
        >
          {game.icon}
        </div>

        <div className="flex items-center gap-2">
          {game.badge && (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                color: game.color,
                backgroundColor: game.background,
              }}
            >
              {game.badge}
            </span>
          )}

          <ArrowUpRight
            size={19}
            className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600"
          />
        </div>
      </div>

      <div className="mt-5 flex-1">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-violet-700">
          {game.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
          {game.description}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Users size={15} />
          {game.players}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Clock3 size={15} />
          {game.duration}
        </div>
      </div>
    </Link>
  );
}
