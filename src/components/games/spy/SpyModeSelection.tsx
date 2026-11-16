"use client";

import Link from "next/link";
import { Users, ArrowRight, ArrowLeft, Smartphone, Globe2, Sparkles } from "lucide-react";

export default function SpyModeSelection() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-100/70 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-100/70 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col items-center justify-center">
        <Link
          href="/games"
          className="mb-7 inline-flex self-start items-center gap-2 rounded-xl border border-blue-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-1 hover:border-blue-300 hover:text-blue-700 sm:absolute sm:left-0 sm:top-0"
        >
          <ArrowLeft size={18} />
          Quay lại
        </Link>

        {/* Header */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 sm:px-4 sm:text-sm">
            <Sparkles size={15} />
            Trò chơi độc quyền Party Play
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Ai là <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">gián điệp?</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Một người đang giữ bí mật. Những người còn lại phải tìm ra kẻ đang
            giả vờ. Bạn muốn chơi theo cách nào?
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid w-full gap-4 sm:gap-5 md:grid-cols-2">
          {/* Offline */}
          <Link
            href="/games/spy/offline"
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/70 sm:p-9"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl transition group-hover:bg-blue-200/70" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition group-hover:scale-105">
                  <Smartphone size={30} />
                </div>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  CHƠI CÙNG THIẾT BỊ
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Chơi trực tiếp</h2>

              <p className="mt-3 text-sm leading-7 text-gray-500 sm:min-h-[72px]">
                Chơi cùng bạn bè trên một thiết bị. Chuyền điện thoại để từng
                người bí mật xem vai trò của mình.
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  Chơi ngay
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:translate-x-1 group-hover:bg-blue-600 group-hover:text-white">
                  <ArrowRight size={19} />
                </div>
              </div>
            </div>
          </Link>

          {/* Online */}
          <Link
            href="/games/spy/online"
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/70 sm:p-9"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl transition group-hover:bg-blue-200/70" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition group-hover:scale-105">
                  <Globe2 size={30} />
                </div>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  CHƠI TRỰC TUYẾN
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Trực tuyến</h2>

              <p className="mt-3 text-sm leading-7 text-gray-500 sm:min-h-[72px]">
                Tạo phòng hoặc tham gia bằng mã phòng. Mỗi người chơi trên thiết
                bị riêng, ở bất cứ đâu.
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">
                  Tạo / Tham gia phòng
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:translate-x-1 group-hover:bg-blue-600 group-hover:text-white">
                  <ArrowRight size={19} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer hint */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <Users size={14} />
          <span>Rủ bạn bè cùng chơi và tìm ra kẻ nói dối!</span>
        </div>
      </div>
    </main>
  );
}
