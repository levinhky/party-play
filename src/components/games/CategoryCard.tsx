import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  background: string;
  accent: string;
  count: string;
}

export default function CategoryCard({
  title,
  description,
  icon,
  href,
  background,
  accent,
  count,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
      style={{ backgroundColor: background }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-6 h-40 w-40 rounded-full opacity-40 transition duration-500 group-hover:scale-125"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
          {icon}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 transition group-hover:bg-white">
          <ArrowUpRight size={20} style={{ color: accent }} />
        </div>
      </div>

      <div className="relative z-10 mt-7">
        <span
          className="text-xs font-bold uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {count}
        </span>

        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h3>

        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </Link>
  );
}
