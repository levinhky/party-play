import { Suspense } from "react";
import ExploreGamesContent from "@/components/games/ExploreGamesContent";

export default function ExploreGamesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-5 py-20 text-center text-slate-500">
            Đang tải danh sách trò chơi...
          </div>
        }
      >
        <ExploreGamesContent />
      </Suspense>
    </main>
  );
}
