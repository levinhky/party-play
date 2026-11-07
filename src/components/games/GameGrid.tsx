import Link from "next/link";
import { ArrowRight, Gamepad2, SearchX } from "lucide-react";
import type { Game } from "@/types/game";
import GameCard from "@/components/games/GameCard";

interface GameGridProps {
  games: Game[];
  totalGames: number;
}

export default function GameGrid({ games, totalGames }: GameGridProps) {
  const isFiltered = games.length !== totalGames;

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {isFiltered ? "Kết quả tìm kiếm" : "Tất cả trò chơi"}
          </h2>

          <p className="mt-1 text-sm text-slate-500" aria-live="polite">
            Tìm thấy {games.length} trò chơi
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
          <Gamepad2 size={15} />
          Sẵn sàng khám phá
        </span>
      </div>

      {games.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <SearchX size={30} className="text-slate-400" />
          </div>

          <h3 className="mt-5 text-xl font-extrabold text-slate-900">
            Không tìm thấy trò chơi
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Hãy thử từ khóa khác hoặc xóa bộ lọc để khám phá thêm nhiều trò
            chơi.
          </p>

          <Link
            href="/games"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Khám phá tất cả
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}
