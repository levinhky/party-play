import { Gamepad2 } from "lucide-react";

export default function LoadingScreen({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang chuyển trang"
      className={`${overlay ? "fixed inset-0 z-[100]" : "min-h-[70vh]"} flex items-center justify-center bg-[#f3f8ff] px-5`}
    >
      <div className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-blue-100 bg-white px-8 py-10 text-center shadow-xl shadow-blue-100/70">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <Gamepad2 size={30} strokeWidth={2.4} />
          <span className="absolute -inset-1 animate-ping rounded-2xl border-2 border-blue-300/50" />
        </div>
        <p className="mt-5 text-lg font-black text-slate-900">Party Play</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Đang chuyển trang...</p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-2/5 animate-[loading-progress_1.2s_ease-in-out_infinite] rounded-full bg-blue-600" />
        </div>
        <span className="sr-only">Vui lòng chờ trong giây lát</span>
      </div>
    </div>
  );
}
