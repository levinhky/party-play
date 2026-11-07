"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  LockKeyhole,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

import type { SpyPlayer } from "@/types/spy";

interface SpyRoleRevealProps {
  player: SpyPlayer;
  playerNumber: number;
  totalPlayers: number;
  onConfirm: () => void;
}

export default function SpyRoleReveal({
  player,
  playerNumber,
  totalPlayers,
  onConfirm,
}: SpyRoleRevealProps) {
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isSpy = player.role === "spy";

  function hideAndContinue() {
    setRevealed(false);
    setConfirmed(true);
  }

  function revealRole() {
    if (!ready || confirmed) return;
    setRevealed(true);
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col justify-center px-4 py-10">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="text-xs font-bold tracking-[0.2em] text-slate-400">
          NGƯỜI CHƠI {playerNumber}/{totalPlayers}
        </div>

        {!ready ? (
          <>
            <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
              <LockKeyhole size={36} />
            </div>

            <h1 className="mt-6 text-3xl font-black text-slate-900">
              Đến lượt bạn!
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hãy cầm thiết bị và đảm bảo không ai khác nhìn thấy màn hình.
              Thông tin vai trò của bạn sẽ được giữ bí mật.
            </p>

            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <EyeOff className="mt-0.5 shrink-0 text-amber-600" size={20} />

                <div>
                  <p className="font-bold text-amber-800">Lưu ý bảo mật</p>
                  <p className="mt-1 text-sm leading-5 text-amber-700">
                    Không để người chơi khác nhìn thấy vai trò hoặc từ khóa của
                    bạn.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReady(true)}
              className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white transition hover:bg-violet-700 active:scale-[0.99]"
            >
              <LockKeyhole size={19} />
              Tôi đang ở một mình
            </button>
          </>
        ) : confirmed ? (
          <>
            <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
              <ShieldCheck size={42} />
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
              Đã ẩn vai trò!
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hãy chuyển thiết bị cho người tiếp theo. Đừng tiết lộ vai trò hoặc
              từ khóa bí mật của bạn.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">
                Người chơi tiếp theo
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {playerNumber < totalPlayers
                  ? `Người chơi ${playerNumber + 1}`
                  : "Bắt đầu trò chơi"}
              </p>
            </div>

            <button
              type="button"
              onClick={onConfirm}
              className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white transition hover:bg-violet-700"
            >
              Tiếp tục
              <ArrowRight size={19} />
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Vai trò của bạn
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Chạm vào thẻ để xem thông tin bí mật.
            </p>

            <div className="mt-8 [perspective:1200px]">
              <button
                type="button"
                onClick={revealRole}
                aria-label={revealed ? "Thẻ vai trò đã mở" : "Mở thẻ vai trò"}
                className="group relative h-[340px] w-full rounded-3xl text-left outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 p-6 text-white shadow-xl transition-transform duration-700 [backface-visibility:hidden]"
                  style={{
                    transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />

                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
                    <Fingerprint size={58} />
                  </div>

                  <p className="relative mt-7 text-xs font-bold tracking-[0.25em] text-violet-200">
                    PARTY PLAY
                  </p>

                  <h2 className="relative mt-3 text-3xl font-black">
                    SECRET ROLE
                  </h2>

                  <div className="relative mt-8 flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold">
                    <Eye size={17} />
                    Chạm để mở thẻ
                  </div>
                </div>

                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border p-6 shadow-xl transition-transform duration-700 [backface-visibility:hidden] ${
                    isSpy
                      ? "border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100"
                      : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100"
                  }`}
                  style={{
                    transform: revealed ? "rotateY(0deg)" : "rotateY(-180deg)",
                  }}
                >
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-3xl ${
                      isSpy
                        ? "bg-rose-200 text-rose-700"
                        : "bg-emerald-200 text-emerald-700"
                    }`}
                  >
                    {isSpy ? (
                      <ShieldAlert size={42} />
                    ) : (
                      <ShieldCheck size={42} />
                    )}
                  </div>

                  <p
                    className={`mt-5 text-xs font-bold tracking-[0.2em] ${
                      isSpy ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    VAI TRÒ CỦA BẠN
                  </p>

                  <h2
                    className={`mt-2 text-3xl font-black ${
                      isSpy ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {isSpy ? "GIÁN ĐIỆP" : "DÂN THƯỜNG"}
                  </h2>

                  <div className="mt-6 w-full rounded-2xl bg-white/80 p-5">
                    <p className="text-xs font-bold tracking-widest text-slate-400">
                      TỪ KHÓA BÍ MẬT
                    </p>

                    <p className="mt-2 break-words text-2xl font-black text-slate-900">
                      {player.word ?? "Bạn không có từ khóa"}
                    </p>
                  </div>

                  <p className="mt-4 text-center text-xs font-semibold text-slate-500">
                    Chạm vào thẻ để lật lại
                  </p>
                </div>
              </button>
            </div>

            {!revealed ? (
              <button
                type="button"
                onClick={revealRole}
                className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white transition hover:bg-violet-700"
              >
                <Eye size={19} />
                Xem vai trò của tôi
              </button>
            ) : (
              <>
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  {isSpy
                    ? player.word
                      ? "Hãy hòa nhập với mọi người mà không để lộ từ khóa của bạn."
                      : "Hãy lắng nghe những người khác và cố đoán từ khóa bí mật."
                    : "Hãy mô tả từ khóa một cách khéo léo để tìm ra gián điệp."}
                </p>

                <button
                  type="button"
                  onClick={() => setRevealed(false)}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw size={17} />
                  Lật lại thẻ
                </button>

                <button
                  type="button"
                  onClick={hideAndContinue}
                  className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-bold text-white transition hover:bg-slate-800"
                >
                  <EyeOff size={18} />
                  Đã ghi nhớ — Ẩn vai trò
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
