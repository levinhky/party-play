"use client";

import { ArrowRight, Smartphone, UserRound, ShieldCheck } from "lucide-react";

interface SpyPassDeviceProps {
  playerName: string;
  playerNumber: number;
  totalPlayers: number;
  onReady: () => void;
}

export default function SpyPassDevice({
  playerName,
  playerNumber,
  totalPlayers,
  onReady,
}: SpyPassDeviceProps) {
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-lg shadow-blue-100/60 sm:p-6">
        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Người chơi {playerNumber}/{totalPlayers}
        </div>

        <div className="mt-7 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Smartphone size={28} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Chuyển thiết bị
            </p>

            <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {playerName}
            </h1>
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-slate-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <UserRound size={18} />
            </div>

            <div>
              <p className="text-lg font-extrabold text-slate-900">
                Đến lượt bạn nhận vai trò
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hãy cầm thiết bị và đảm bảo không ai khác nhìn thấy màn hình.
                Nhấn nút bên dưới khi bạn đã sẵn sàng.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <ShieldCheck className="shrink-0 text-emerald-600" size={22} />

          <p className="text-sm font-medium leading-5 text-emerald-700">
            Vai trò của người chơi trước đã được ẩn. Thông tin bí mật của bạn sẽ
            không xuất hiện cho đến khi bạn xác nhận.
          </p>
        </div>

        <button
          type="button"
          onClick={onReady}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-base font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
        >
          Tôi đã sẵn sàng
          <ArrowRight size={19} />
        </button>
      </div>
    </div>
  );
}
