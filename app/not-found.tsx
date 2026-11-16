import Link from "next/link";
import { ArrowLeft, Gamepad2, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center bg-[#f3f8ff] px-4 py-12 sm:px-6">
      <section className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-7 text-center shadow-xl shadow-blue-100/60 sm:p-10">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-50 text-blue-600">
          <Gamepad2 size={42} strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white">
            <Search size={15} strokeWidth={2.5} />
          </span>
        </div>
        <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-600">Lạc đường mất rồi</p>
        <h1 className="mt-2 text-7xl font-black tracking-tight text-slate-900 sm:text-8xl">404</h1>
        <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">Không tìm thấy trang</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 sm:text-base">
          Đường dẫn này không tồn tại hoặc đã được thay đổi. Hãy quay về trang chủ hoặc chọn một trò chơi khác nhé.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            <ArrowLeft size={17} />Về trang chủ
          </Link>
          <Link href="/games" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
            <Gamepad2 size={17} />Khám phá trò chơi
          </Link>
        </div>
      </section>
    </main>
  );
}
