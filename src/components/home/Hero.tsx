import Link from "next/link";
import { ArrowRight, Play, Sparkles, Users, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f3f8ff]">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 shadow-sm">
            <Sparkles size={15} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700 sm:text-sm">
              Cùng chơi vui – Cùng học giỏi
            </span>
          </div>

          <h1 className="mt-7 max-w-xl text-4xl font-black leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Khoảnh khắc vui.
            <br />
            Trò chơi thú vị.
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 bg-clip-text text-transparent">
              Tiếng Anh tiến bộ.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Kết nối bạn bè qua những trò chơi tập thể đầy tiếng cười, hoặc nâng
            cao tiếng Anh qua các thử thách thú vị. Trò chơi yêu thích tiếp theo
            của bạn bắt đầu từ đây!
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Khám phá trò chơi
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <Play size={17} className="fill-current" />
              Tạo trò chơi
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Users size={17} className="text-blue-600" />
              <span>Dành cho nhóm bạn</span>
            </div>

            <div className="flex items-center gap-2">
              <Zap size={17} className="text-blue-500" />
              <span>Dễ dàng bắt đầu</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-8 rounded-[40px] bg-gradient-to-br from-blue-300/50 to-blue-300/50 blur-2xl" />

          <div className="relative rounded-[32px] border border-white bg-white/80 p-4 shadow-2xl shadow-blue-200/40 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Gợi ý hôm nay
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                  Đêm hội trò chơi 🎉
                </h2>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                Sẵn sàng chơi
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl">
                  🕵️
                </div>
                <p className="mt-4 text-sm font-extrabold text-slate-900">
                  Ai là gián điệp?
                </p>
                <p className="mt-1 text-xs text-slate-500">Tìm ra kẻ giả mạo</p>
              </div>

              <div className="mt-6 rounded-2xl bg-blue-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl">
                  🧠
                </div>
                <p className="mt-4 text-sm font-extrabold text-slate-900">
                  Thử thách trí nhớ
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Kiểm tra trí nhớ của bạn
                </p>
              </div>

              <div className="rounded-2xl bg-blue-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl">
                  📚
                </div>
                <p className="mt-4 text-sm font-extrabold text-slate-900">
                  Làm chủ từ vựng
                </p>
                <p className="mt-1 text-xs text-slate-500">Học thêm từ mới</p>
              </div>

              <div className="mt-6 rounded-2xl bg-blue-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl">
                  💬
                </div>
                <p className="mt-4 text-sm font-extrabold text-slate-900">
                  Thử thách Taboo
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Diễn tả từ khóa bí mật
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                🎮
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Trò chơi đang chờ bạn!</p>
                <p className="mt-1 text-xs text-slate-400">
                  Chọn trò chơi và rủ bạn bè cùng tham gia.
                </p>
              </div>

              <ArrowRight size={19} className="shrink-0 text-blue-300" />
            </div>
          </div>

          <div className="absolute -left-4 top-24 hidden -rotate-6 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:flex">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-bold text-slate-700">
              Cùng chơi thôi!
            </span>
          </div>

          <div className="absolute -right-3 bottom-16 hidden rotate-3 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:flex">
            <span className="text-2xl">💜</span>
            <span className="text-sm font-bold text-slate-700">
              Học vui mỗi ngày
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
