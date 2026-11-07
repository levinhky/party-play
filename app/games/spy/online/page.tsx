import { Suspense } from "react";
import SpyOnlinePage from "@/components/games/spy/online/SpyOnlinePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
          Đang tải...
        </div>
      }
    >
      <SpyOnlinePage />
    </Suspense>
  );
}