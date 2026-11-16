import Link from "next/link";
import { Gamepad2, Heart } from "lucide-react";

const footerLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Trò chơi tập thể", href: "/games?category=party" },
  { label: "Học tiếng Anh", href: "/games?category=english" },
  { label: "Tạo trò chơi", href: "/create" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Gamepad2 size={20} />
              </div>

              <span className="text-lg font-extrabold text-slate-900">
                party<span className="text-blue-600">play</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Kết nối mọi người qua những trò chơi vui vẻ và các thử thách học tập.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-500 transition hover:text-blue-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Party Play. Bảo lưu mọi quyền.</p>

          <p className="flex items-center gap-1.5">
            Tạo nên những khoảnh khắc vui
            <Heart size={13} className="fill-blue-500 text-blue-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
