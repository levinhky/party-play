import { Suspense } from "react";
import TabooOnline from "@/components/games/taboo/TabooOnline";

export default function TabooOnlinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f8ff] text-slate-500">
          Đang tải phòng Taboo...
        </div>
      }
    >
      <TabooOnline />
    </Suspense>
  );
}
