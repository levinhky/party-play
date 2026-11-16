"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { BookOpen, Gamepad2, Home, LogIn, LogOut, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AppAccountBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const permanentUser = Boolean(user && !user.is_anonymous && user.email);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || password.length < 6) {
      setError("Nhập email và mật khẩu có ít nhất 6 ký tự.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        if (data.session) {
          setMessage("Tạo tài khoản thành công.");
          setPassword("");
        } else {
          setMessage("Tài khoản đã được tạo. Hãy xác nhận email để hoàn tất đăng ký.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setPassword("");
        setOpen(false);
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Không thể đăng nhập lúc này.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 shadow-sm shadow-blue-950/[0.03] backdrop-blur-xl">
        <nav aria-label="Điều hướng chính" className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6 lg:px-8">
          <Link href="/" aria-label="Party Play - Trang chủ" className="group flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200 transition group-hover:-rotate-3 group-hover:scale-105">
              <Gamepad2 size={22} strokeWidth={2.3} />
            </span>
            <span className="truncate text-[17px] font-black tracking-tight text-slate-900 sm:text-lg">Party <span className="text-blue-600">Play</span></span>
          </Link>

          <div className="hidden items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-1 md:flex">
            <Link href="/" className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${pathname === "/" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white hover:text-blue-700"}`}><Home size={16} />Trang chủ</Link>
            <Link href="/games" className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${pathname.startsWith("/games") ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white hover:text-blue-700"}`}><Gamepad2 size={16} />Trò chơi</Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {permanentUser ? (
              <>
                <Link href="/account" className={`inline-flex max-w-36 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition sm:max-w-48 sm:px-3 ${pathname === "/account" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><UserRound size={16} /></span>
                  <span className="truncate">{typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim() ? user.user_metadata.display_name : "Tài khoản"}</span>
                </Link>
                <button type="button" aria-label="Đăng xuất" onClick={() => void supabase.auth.signOut()} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:w-auto sm:gap-2 sm:px-3"><LogOut size={17} /><span className="hidden text-sm font-bold sm:inline">Đăng xuất</span></button>
              </>
            ) : (
              <button type="button" onClick={() => { setOpen(true); setError(""); setMessage(""); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:px-4"><UserRound size={16} /><span>Đăng nhập</span></button>
            )}
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="account-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><LogIn size={22} /></div>
                <h1 id="account-title" className="text-2xl font-extrabold text-slate-900">{mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
                <p className="mt-1 text-sm text-slate-500">Tài khoản dùng chung cho toàn bộ Party Play.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
            </div>
            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Email
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Mật khẩu
                <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{busy ? "Đang xử lý…" : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</button>
            </form>
            <button type="button" onClick={() => { setMode((current) => current === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="mt-4 w-full text-center text-sm font-semibold text-blue-700 hover:text-blue-900">{mode === "signin" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</button>
          </section>
        </div>
      )}
    </>
  );
}
