"use client";

import Link from "next/link";
import { Users, ArrowRight, ArrowLeft, Smartphone, Globe2, Sparkles } from "lucide-react";

export default function SpyModeSelection() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-gray-900 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-100/70 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-100/70 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center">
        <Link
          href="/games"
          className="absolute left-0 top-0 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-1 hover:border-violet-300 hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Quay lại
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
            <Sparkles size={15} />
            Party Play Original Game
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl">
            Who Is The{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Spy?
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Một người đang giữ bí mật. Những người còn lại phải tìm ra kẻ đang
            giả vờ. Bạn muốn chơi theo cách nào?
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid w-full gap-5 md:grid-cols-2">
          {/* Offline */}
          <Link
            href="/games/spy/offline"
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/70 sm:p-9"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-100/70 blur-3xl transition group-hover:bg-violet-200/70" />

            <div className="relative">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition group-hover:scale-105">
                  <Smartphone size={30} />
                </div>

                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  LOCAL PLAY
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Offline</h2>

              <p className="mt-3 min-h-[72px] text-sm leading-7 text-gray-500">
                Chơi cùng bạn bè trên một thiết bị. Chuyền điện thoại để từng
                người bí mật xem vai trò của mình.
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm font-semibold text-violet-600">
                  Chơi ngay
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition group-hover:translate-x-1 group-hover:bg-violet-600 group-hover:text-white">
                  <ArrowRight size={19} />
                </div>
              </div>
            </div>
          </Link>

          {/* Online */}
          <Link
            href="/games/spy/online"
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300 hover:shadow-xl hover:shadow-fuchsia-100/70 sm:p-9"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-100/70 blur-3xl transition group-hover:bg-fuchsia-200/70" />

            <div className="relative">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 transition group-hover:scale-105">
                  <Globe2 size={30} />
                </div>

                <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                  MULTIPLAYER
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Online</h2>

              <p className="mt-3 min-h-[72px] text-sm leading-7 text-gray-500">
                Tạo phòng hoặc tham gia bằng mã phòng. Mỗi người chơi trên thiết
                bị riêng, ở bất cứ đâu.
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm font-semibold text-fuchsia-600">
                  Tạo / Tham gia phòng
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-600 transition group-hover:translate-x-1 group-hover:bg-fuchsia-600 group-hover:text-white">
                  <ArrowRight size={19} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer hint */}
        <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
          <Users size={14} />
          <span>Rủ bạn bè cùng chơi và tìm ra kẻ nói dối!</span>
        </div>
      </div>
    </main>
  );
}
