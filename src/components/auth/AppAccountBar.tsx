"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { LogIn, LogOut, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export default function AppAccountBar() {
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
      <header className="relative z-30 border-b border-slate-200 bg-white">
        <nav aria-label="Điều hướng chính" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-tight text-violet-700">Party Play</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/games" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700">Trò chơi</Link>
            {permanentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-52 truncate text-sm text-slate-600 sm:block">{user?.email}</span>
                <button type="button" onClick={() => void supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"><LogOut size={16} /><span className="hidden sm:inline">Đăng xuất</span></button>
              </div>
            ) : (
              <button type="button" onClick={() => { setOpen(true); setError(""); setMessage(""); }} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"><UserRound size={16} /><span>Tài khoản</span></button>
            )}
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="account-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><LogIn size={22} /></div>
                <h1 id="account-title" className="text-2xl font-extrabold text-slate-900">{mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
                <p className="mt-1 text-sm text-slate-500">Tài khoản dùng chung cho toàn bộ Party Play.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
            </div>
            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Email
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Mật khẩu
                <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">{busy ? "Đang xử lý…" : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</button>
            </form>
            <button type="button" onClick={() => { setMode((current) => current === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="mt-4 w-full text-center text-sm font-semibold text-violet-700 hover:text-violet-900">{mode === "signin" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</button>
          </section>
        </div>
      )}
    </>
  );
}
