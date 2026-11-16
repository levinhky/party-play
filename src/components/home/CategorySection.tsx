import CategoryCard from "@/components/games/CategoryCard";

const categories = [
  {
    title: "Trò chơi tập thể",
    description:
      "Cùng bạn bè cười đùa, thi đấu và tạo nên những khoảnh khắc đáng nhớ.",
    icon: "🎉",
    href: "/games?category=party",
    background: "#F3E8FF",
    accent: "#7C3AED",
    count: "Dành cho cả nhóm",
  },
  {
    title: "Học tiếng Anh",
    description:
      "Luyện từ vựng, tự tin giao tiếp và cải thiện tiếng Anh thông qua những trò chơi thú vị.",
    icon: "🚀",
    href: "/games?category=english",
    background: "#DBEAFE",
    accent: "#2563EB",
    count: "Học mà chơi, chơi mà học",
  },
];

export default function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            Chọn phong cách của bạn
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Hôm nay bạn muốn chơi gì?
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-slate-500">
          Dù bạn muốn vui chơi cùng bạn bè hay học thêm điều mới, luôn có một
          trò chơi phù hợp dành cho bạn.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard key={category.title} {...category} />
        ))}
      </div>
    </section>
  );
}
