"use client";

import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

export type CategoryFilter = "all" | "party" | "english";
export type PlayerFilter = "all" | "solo" | "group";
export type SortOption = "featured" | "name";

interface GameFiltersProps {
  search: string;
  category: CategoryFilter;
  players: PlayerFilter;
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onPlayersChange: (value: PlayerFilter) => void;
  onSortChange: (value: SortOption) => void;
}

const categories: { label: string; value: CategoryFilter }[] = [
  { label: "Tất cả trò chơi", value: "all" },
  { label: "Trò chơi tập thể", value: "party" },
  { label: "Học tiếng Anh", value: "english" },
];

export default function GameFilters({
  search,
  category,
  players,
  sort,
  onSearchChange,
  onCategoryChange,
  onPlayersChange,
  onSortChange,
}: GameFiltersProps) {
  const hasFilters = search !== "" || category !== "all" || players !== "all";

  function resetFilters() {
    onSearchChange("");
    onCategoryChange("all");
    onPlayersChange("all");
    onSortChange("featured");
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm trò chơi..."
            aria-label="Tìm trò chơi"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:text-sm"
          />

          {search && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="shrink-0 text-slate-400" />

          <label htmlFor="game-sort" className="sr-only">
            Sắp xếp trò chơi
          </label>

          <span className="relative min-w-0 flex-1 sm:flex-none">
            <select
              id="game-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
              className="h-12 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="featured">Nổi bật trước</option>
              <option value="name">Tên: A–Z</option>
            </select>
            <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Danh mục
          </p>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const active = category === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onCategoryChange(item.value)}
                  aria-pressed={active}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label
              htmlFor="player-filter"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Số lượng người chơi
            </label>

            <span className="relative block w-full sm:w-auto sm:min-w-48">
              <select
                id="player-filter"
                value={players}
                onChange={(event) =>
                  onPlayersChange(event.target.value as PlayerFilter)
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Tất cả số lượng</option>
                <option value="solo">Có thể chơi một mình</option>
                <option value="group">Chơi theo nhóm</option>
              </select>
              <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 sm:self-end"
            >
              <X size={15} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
