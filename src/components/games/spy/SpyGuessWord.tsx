"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";

interface SpyGuessWordProps {
  spyName: string;
  secretWord: string;
  onGuess: (correct: boolean) => void;
}

export default function SpyGuessWord({
  spyName,
  secretWord,
  onGuess,
}: SpyGuessWordProps) {
  const [guess, setGuess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  function normalize(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("vi");
  }

  function submitGuess() {
    onGuess(normalize(guess) === normalize(secretWord));
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldAlert size={40} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900">
          Cơ hội cuối cùng!
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Gián điệp đã bị phát hiện. Nhưng vẫn còn một cơ hội để giành chiến
          thắng!
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6">
        <div className="rounded-2xl bg-rose-50 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Gián điệp cuối cùng
          </p>

          <h2 className="mt-2 break-words text-2xl font-black text-rose-900">
            {spyName}
          </h2>
        </div>

        <div className="mt-7">
          <label
            htmlFor="spy-guess"
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <KeyRound size={18} className="text-blue-600" />
            Từ khóa bí mật là gì?
          </label>

          <input
            id="spy-guess"
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && guess.trim()) {
                setShowConfirm(true);
              }
            }}
            maxLength={100}
            placeholder="Nhập từ khóa bạn đoán..."
            className="mt-3 h-14 w-full rounded-xl border border-slate-200 px-4 text-lg font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Bạn chỉ có một lần đoán. Hãy suy nghĩ thật kỹ!
          </p>
        </div>

        <button
          type="button"
          disabled={!guess.trim()}
          onClick={() => setShowConfirm(true)}
          className="mt-6 h-14 w-full rounded-2xl bg-rose-600 font-bold text-white transition hover:bg-rose-700 disabled:opacity-40"
        >
          Đưa ra câu trả lời
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">
              Bạn chắc chắn chứ?
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Câu trả lời của bạn là:
            </p>

            <p className="mt-2 break-words text-xl font-black text-blue-700">
              {guess}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-xl border border-slate-200 font-bold text-slate-600"
              >
                Sửa lại
              </button>

              <button
                type="button"
                onClick={submitGuess}
                className="h-12 rounded-xl bg-rose-600 font-bold text-white"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
