import { navigateWithLoading } from "@/lib/navigation";
import { Sparkles, Users, BookOpen, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExploreHeader() {
  const router = useRouter();

  const handleGoBack = () => {
    navigateWithLoading(() => router.push("/"));
  };

  return (
    <section className="relative overflow-hidden bg-[#f3f8ff]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-10 lg:py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={handleGoBack}
          className="mr-4 mb-4 md:mb-0 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-x-1 hover:border-blue-300 hover:bg-white hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>

        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2">
          <Sparkles size={15} className="shrink-0 text-blue-600" />
          <span className="min-w-0 text-sm font-semibold text-blue-700">
            Khám phá trò chơi yêu thích tiếp theo
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Bạn muốn chơi
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            trò gì hôm nay?
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Từ những trò chơi tập thể đầy tiếng cười đến các thử thách tiếng Anh
          thú vị, hãy tìm trò chơi phù hợp để cùng bạn bè trải nghiệm hoặc tự
          mình chinh phục.
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Users size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              Trò chơi tập thể
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <BookOpen size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              Học tiếng Anh
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
