"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, LoaderCircle, Save, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type PasswordFlow = "change" | "recovery";

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [flow, setFlow] = useState<PasswordFlow>("change");
  const [codeRequested, setCodeRequested] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setEmail(currentUser?.email ?? "");
      setDisplayName(typeof currentUser?.user_metadata?.display_name === "string" ? currentUser.user_metadata.display_name : "");
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email) setEmail(currentUser.email);
      setDisplayName(typeof currentUser?.user_metadata?.display_name === "string" ? currentUser.user_metadata.display_name : "");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const saveDisplayName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanName = displayName.trim();
    if (!cleanName) {
      setError("Hãy nhập tên hiển thị.");
      return;
    }
    setBusy(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ data: { display_name: cleanName } });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setUser(data.user);
    setMessage("Đã cập nhật tên hiển thị.");
  };

  const requestVerificationCode = async () => {
    setError("");
    setMessage("");
    const targetEmail = (flow === "change" ? user?.email : email)?.trim();
    if (!targetEmail) {
      setError("Không tìm thấy email tài khoản.");
      return;
    }
    setBusy(true);
    const result = flow === "change"
      ? await supabase.auth.reauthenticate()
      : await supabase.auth.resetPasswordForEmail(targetEmail);
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setCodeRequested(true);
    setMessage(`Mã xác minh đã được gửi đến ${targetEmail}.`);
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(code)) {
      setError("Nhập mã xác minh gồm 6 chữ số.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới cần có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setBusy(true);
    let updateError: Error | null = null;
    if (flow === "change") {
      const result = await supabase.auth.updateUser({ password: newPassword, nonce: code });
      updateError = result.error;
    } else {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" });
      if (verifyError) {
        updateError = verifyError;
      } else {
        const result = await supabase.auth.updateUser({ password: newPassword });
        updateError = result.error;
      }
    }
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCodeRequested(false);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Mật khẩu đã được cập nhật thành công.");
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user ?? null);
  };

  const switchFlow = (nextFlow: PasswordFlow) => {
    setFlow(nextFlow);
    setCodeRequested(false);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/games" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
        <ArrowLeft size={17} /> Về trò chơi
      </Link>
      <header className="mb-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">PARTY PLAY</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Tài khoản</h1>
        <p className="mt-2 text-slate-500">Quản lý thông tin và bảo mật tài khoản của bạn.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-slate-500"><LoaderCircle className="animate-spin" size={18} />Đang tải tài khoản…</div>
      ) : (
        <div className="space-y-5">
          {!user && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">Bạn chưa đăng nhập. Hãy đăng nhập từ nút <strong>Tài khoản</strong> trên thanh điều hướng để sửa hồ sơ. Nếu quên mật khẩu, bạn có thể gửi mã khôi phục bên dưới.</div>}

          {user && !user.is_anonymous && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><UserRound size={21} /></span><div><h2 className="font-bold text-slate-900">Thông tin cá nhân</h2><p className="text-sm text-slate-500">{user.email}</p></div></div>
              <form onSubmit={(event) => void saveDisplayName(event)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-semibold text-slate-700">Tên hiển thị<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} className={fieldClass} placeholder="Tên bạn muốn mọi người nhìn thấy" /></label>
                <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"><Save size={16} />Lưu tên</button>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><KeyRound size={21} /></span><div><h2 className="font-bold text-slate-900">Bảo mật mật khẩu</h2><p className="text-sm text-slate-500">Mật khẩu chỉ được thay đổi sau khi xác minh mã email.</p></div></div>
            <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
              {user && !user.is_anonymous && <button type="button" onClick={() => switchFlow("change")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${flow === "change" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Đổi mật khẩu</button>}
              <button type="button" onClick={() => switchFlow("recovery")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${flow === "recovery" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Quên mật khẩu</button>
            </div>
            {flow === "recovery" && !codeRequested && <label className="mb-4 block text-sm font-semibold text-slate-700">Email tài khoản<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} placeholder="ban@example.com" /></label>}
            {!codeRequested ? (
              <button type="button" onClick={() => void requestVerificationCode()} disabled={busy || (flow === "recovery" && !email.trim()) || (flow === "change" && (!user || user.is_anonymous))} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin" />}{flow === "change" ? "Gửi mã xác minh" : "Gửi mã khôi phục"}</button>
            ) : (
              <form onSubmit={(event) => void updatePassword(event)} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Mã xác minh<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className={`${fieldClass} font-mono tracking-[0.3em]`} placeholder="123456" /></label>
                <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} /></label>
                <label className="block text-sm font-semibold text-slate-700">Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClass} /></label>
                <div className="flex flex-wrap gap-2 pt-1"><button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin" />}Cập nhật mật khẩu</button><button type="button" disabled={busy} onClick={() => void requestVerificationCode()} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Gửi mã mới</button></div>
              </form>
            )}
          </section>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        </div>
      )}
    </main>
  );
}
