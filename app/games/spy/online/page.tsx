import { Suspense } from "react";
import SpyOnlinePage from "@/components/games/spy/online/SpyOnlinePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-sm font-semibold text-blue-700">
          Đang tải phòng...
        </div>
      }
    >
      <SpyOnlinePage />
    </Suspense>
  );
}
