"use client";

import { useEffect, useState } from "react";
import { Clock3, Flag, Pause, Play, RotateCcw, Users } from "lucide-react";

interface SpyDiscussionProps {
  playerNames: string[];
  minutes: number;
  onFinish: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function SpyDiscussion({
  playerNames,
  minutes,
  onFinish,
}: SpyDiscussionProps) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setIsRunning(false);
      } else {
        setSecondsLeft((seconds) => Math.max(0, seconds - 1));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const progress = minutes > 0 ? (secondsLeft / (minutes * 60)) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-14">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Users size={40} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">
          Bắt đầu thảo luận!
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          Mô tả từ khóa của bạn, lắng nghe người khác và tìm ra ai đang nói dối.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-9 sm:p-6">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-500">THỜI GIAN CÒN LẠI</p>

          <div
            className={`mt-3 font-mono text-5xl font-black tracking-tight sm:text-7xl ${
              secondsLeft <= 30 ? "text-rose-600" : "text-slate-900"
            }`}
            role="timer"
            aria-live="off"
          >
            {formatTime(secondsLeft)}
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ${
                secondsLeft <= 30 ? "bg-rose-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsRunning((running) => !running)}
            disabled={secondsLeft === 0}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? "Tạm dừng" : "Tiếp tục"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSecondsLeft(minutes * 60);
              setIsRunning(true);
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw size={17} />
            Đặt lại giờ
          </button>
        </div>

        <div className="mt-7 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
            <Clock3 size={17} />
            Gợi ý cách chơi
          </div>

          <ul className="mt-3 space-y-2 text-sm leading-5 text-blue-900/80">
            <li>• Mỗi người lần lượt mô tả từ khóa của mình.</li>
            <li>• Không được nói thẳng từ khóa bí mật.</li>
            <li>• Đặt câu hỏi để phát hiện người có mô tả đáng ngờ.</li>
            <li>• Khi hết giờ, cả nhóm bỏ phiếu tìm gián điệp.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setShowEndConfirm(true)}
          className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
        >
          <Flag size={18} />
          Kết thúc thảo luận và bỏ phiếu
        </button>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {playerNames.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
          >
            {name}
          </span>
        ))}
      </div>

      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-game-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2
              id="end-game-title"
              className="text-xl font-black text-slate-900"
            >
              Bắt đầu bỏ phiếu?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hãy chắc chắn mọi người đã hoàn thành phần thảo luận. Sau bước
              này, tất cả người chơi còn lại sẽ tiến hành bỏ phiếu.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="h-12 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={onFinish}
                className="h-12 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                Bắt đầu bỏ phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
