"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ExploreHeader from "@/components/games/ExploreHeader";
import GameFilters, {
  type CategoryFilter,
  type PlayerFilter,
  type SortOption,
} from "@/components/games/GameFilters";
import GameGrid from "@/components/games/GameGrid";

import { games } from "@/data/games";

export default function ExploreGamesContent() {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category");

  const validCategory: CategoryFilter =
    initialCategory === "party" || initialCategory === "english"
      ? initialCategory
      : "all";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>(validCategory);
  const [players, setPlayers] = useState<PlayerFilter>("all");
  const [sort, setSort] = useState<SortOption>("featured");

  const filteredGames = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = games.filter((game) => {
      const matchesSearch =
        !normalizedSearch ||
        game.title.toLowerCase().includes(normalizedSearch) ||
        game.description.toLowerCase().includes(normalizedSearch);

      const matchesCategory = category === "all" || game.category === category;

      const matchesPlayers =
        players === "all" ||
        (players === "solo" &&
          /(^|[^0-9])1\+?\s*(người chơi|players)/i.test(game.players)) ||
        (players === "group" &&
          !/(^|[^0-9])1\+?\s*(người chơi|players)/i.test(game.players));

      return matchesSearch && matchesCategory && matchesPlayers;
    });

    if (sort === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    }

    return result;
  }, [search, category, players, sort]);

  return (
    <>
      <ExploreHeader />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-10 lg:px-8">
        <GameFilters
          search={search}
          category={category}
          players={players}
          sort={sort}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onPlayersChange={setPlayers}
          onSortChange={setSort}
        />

        <GameGrid games={filteredGames} totalGames={games.length} />
      </div>
    </>
  );
}
