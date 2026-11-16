"use client";

import type { TabooTeam } from "@/types/taboo";
import { Crown, Trophy } from "lucide-react";

interface TabooScoreboardProps {
  mode: "individual" | "teams";
  teams: TabooTeam[];
  currentTeamIndex: number;
  currentRound: number;
  totalRounds: number;
}

const teamStyles = [
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-sky-200 bg-sky-50 text-sky-700",
];

export default function TabooScoreboard({
  mode,
  teams,
  currentTeamIndex,
  currentRound,
  totalRounds,
}: TabooScoreboardProps) {
  return (
    <section className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 font-black text-slate-900"><Trophy size={18} className="text-amber-500" />{mode === "individual" ? "Điểm cá nhân" : "Bảng điểm đội"}</h2>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          Vòng {currentRound} / {totalRounds}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`relative overflow-hidden rounded-2xl border p-4 transition ${
              teamStyles[index % teamStyles.length]
            } ${
              index === currentTeamIndex
                ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg shadow-blue-100"
                : ""
            }`}
          >
            {index === currentTeamIndex && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-500" />}
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold">{team.name}</p>

              {index === currentTeamIndex && (
                <Crown size={15} className="shrink-0" />
              )}
            </div>

            <p className="mt-3 text-3xl font-black">{team.score}</p>

            <p className="mt-1 text-xs opacity-70">điểm</p>
          </div>
        ))}
      </div>
    </section>
  );
}
