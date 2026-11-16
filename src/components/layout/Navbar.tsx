"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Gamepad2, ChevronDown } from "lucide-react";

const navigation = [
  { label: "Trang chủ", href: "/" },
  { label: "Trò chơi", href: "/games" },
  { label: "Học tiếng Anh", href: "/games?category=english" },
  { label: "Tạo trò chơi", href: "/create" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Gamepad2 size={23} strokeWidth={2.5} />
          </div>

          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            party<span className="text-blue-600">play</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navigation.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Tạo trò chơi
            <ChevronDown size={16} className="rotate-[-90deg]" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-700 md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
