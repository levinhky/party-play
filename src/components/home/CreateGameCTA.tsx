import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const benefits = [
  "Tạo bộ từ vựng của riêng bạn",
  "Tùy chỉnh câu hỏi và từ khóa",
  "Chơi với nội dung do bạn tạo",
];

export default function CreateGameCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-16 lg:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
              <Sparkles size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sáng tạo theo cách của bạn
              </span>
            </div>

            <h2 className="mt-6 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Ý tưởng của bạn.
              <br />
              Trò chơi của bạn.
              <br />
              Luật chơi của bạn.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-violet-100 sm:text-base">
              Tự tạo thẻ ghi nhớ, câu hỏi và bộ sưu tập từ vựng của riêng bạn.
              Biến ý tưởng thành những trò chơi thú vị để mọi người cùng tham
              gia.
            </p>

            <Link
              href="/create"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-50"
            >
              Bắt đầu sáng tạo
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <p className="text-xs font-semibold text-violet-200">
                  BỘ SƯU TẬP CỦA BẠN
                </p>
                <h3 className="mt-1 text-xl font-extrabold">
                  Bộ tiếng Anh của tôi
                </h3>
              </div>

              <span className="rounded-xl bg-white/15 p-3 text-2xl">📚</span>
            </div>

            <div className="mt-5 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="shrink-0 text-green-300" />
                  <span className="text-sm font-medium text-white/90">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between rounded-2xl bg-white p-4 text-slate-900">
              <div>
                <p className="text-sm font-extrabold">Sẵn sàng chơi chưa?</p>
                <p className="mt-1 text-xs text-slate-500">
                  Trò chơi tiếp theo bắt đầu từ đây.
                </p>
              </div>

              <span className="text-3xl">🎮</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
