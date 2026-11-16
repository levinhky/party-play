import Link from "next/link";
import { ArrowRight } from "lucide-react";
import GameCard from "@/components/games/GameCard";
import { games } from "@/data/games";

export default function FeaturedGames() {
  const featuredGames = games.slice(0, 4);

  return (
    <section className="bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-10 lg:px-8">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Được chọn cho bạn
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Trò chơi phổ biến
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
              Khám phá những trò chơi được cộng đồng yêu thích nhất.
            </p>
          </div>

          <Link
            href="/games"
            className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-900 sm:flex"
          >
            Xem tất cả
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        <Link
          href="/games"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 sm:hidden"
        >
          Xem tất cả trò chơi
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
