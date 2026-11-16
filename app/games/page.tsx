import { Suspense } from "react";
import ExploreGamesContent from "@/components/games/ExploreGamesContent";
import GameGridSkeleton from "@/components/games/GameGridSkeleton";

export default function ExploreGamesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense
        fallback={<GameGridSkeleton />}
      >
        <ExploreGamesContent />
      </Suspense>
    </main>
  );
}
