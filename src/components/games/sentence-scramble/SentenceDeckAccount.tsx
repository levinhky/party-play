"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Cloud, Save, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

interface SentenceDeck {
  id: string;
  name: string;
  sentences: string[];
  updated_at: string;
}

interface SentenceDeckAccountProps {
  sentences: string[];
  onLoadDeck: (sentences: string[]) => void;
}

export default function SentenceDeckAccount({ sentences, onLoadDeck }: SentenceDeckAccountProps) {
  const [user, setUser] = useState<User | null>(null);
  const [deckName, setDeckName] = useState("");
  const [decks, setDecks] = useState<SentenceDeck[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const permanentUser = Boolean(user && !user.is_anonymous && user.email);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user || session.user.is_anonymous) setDecks([]);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!permanentUser) return;
    let active = true;
    void supabase
      .from("sentence_scramble_decks")
      .select("id, name, sentences, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError(`Không tải được bộ câu: ${loadError.message}`);
          return;
        }
        setDecks((data ?? []) as SentenceDeck[]);
      });
    return () => { active = false; };
  }, [permanentUser, user?.id]);

  const saveDeck = async (existingDeck?: SentenceDeck) => {
    const name = (existingDeck?.name ?? deckName).trim();
    if (!name) {
      setError("Nhập tên cho bộ câu trước khi lưu.");
      return;
    }
    if (sentences.length === 0) {
      setError("Hãy thêm ít nhất một câu vào bộ hiện tại trước khi lưu.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const now = new Date().toISOString();
    const query = existingDeck
      ? supabase.from("sentence_scramble_decks").update({ name, sentences, updated_at: now }).eq("id", existingDeck.id)
      : supabase.from("sentence_scramble_decks").insert({ user_id: user!.id, name, sentences, updated_at: now });
    const { error: saveError } = await query;
    setBusy(false);
    if (saveError) {
      setError(`Không lưu được bộ câu: ${saveError.message}`);
      return;
    }
    setMessage(`Đã lưu ${name} lên tài khoản.`);
    setDeckName("");
    const { data } = await supabase.from("sentence_scramble_decks").select("id, name, sentences, updated_at").order("updated_at", { ascending: false });
    if (data) setDecks(data as SentenceDeck[]);
  };

  const deleteDeck = async (deck: SentenceDeck) => {
    setBusy(true);
    setError("");
    const { error: deleteError } = await supabase.from("sentence_scramble_decks").delete().eq("id", deck.id);
    setBusy(false);
    if (deleteError) {
      setError(`Không xóa được bộ câu: ${deleteError.message}`);
      return;
    }
    setDecks((current) => current.filter((item) => item.id !== deck.id));
    setMessage(`Đã xóa bộ ${deck.name}.`);
  };

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm"><Cloud size={19} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-gray-900">Bộ câu đã lưu</h2>
          <p className="mt-1 text-sm text-gray-600">Quản lý bộ câu trên tài khoản Party Play của bạn.</p>
        </div>
      </div>

      {!permanentUser ? (
        <p className="mt-4 rounded-xl bg-white px-3 py-3 text-sm text-gray-600">Hãy chọn <strong>Tài khoản</strong> ở thanh trên cùng để đăng nhập hoặc tạo tài khoản. Sau đó bạn có thể lưu bộ câu tại đây.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="truncate text-sm font-medium text-violet-900">Đang đăng nhập: {user?.email}</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={deckName} onChange={(event) => setDeckName(event.target.value)} maxLength={80} placeholder="Tên bộ câu mới, ví dụ: Du lịch" className="min-w-0 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            <button type="button" disabled={busy} onClick={() => void saveDeck()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"><BookmarkPlus size={17} />Lưu bộ hiện tại</button>
          </div>
          {decks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-900">Bộ câu đã lưu</p>
              {decks.map((deck) => (
                <div key={deck.id} className="flex items-center gap-2 rounded-xl border border-violet-100 bg-white p-2.5">
                  <button type="button" onClick={() => { onLoadDeck(deck.sentences); setMessage(`Đã mở ${deck.name} vào bộ câu hiện tại.`); setError(""); }} className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left hover:bg-violet-50">
                    <span className="block truncate text-sm font-semibold text-gray-900">{deck.name}</span>
                    <span className="text-xs text-gray-500">{deck.sentences.length} câu</span>
                  </button>
                  <button type="button" title="Cập nhật bằng bộ câu hiện tại" disabled={busy} onClick={() => void saveDeck(deck)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"><Save size={14} />Cập nhật</button>
                  <button type="button" title={`Xóa ${deck.name}`} disabled={busy} onClick={() => void deleteDeck(deck)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          ) : <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-gray-500">Chưa có bộ câu nào trên tài khoản.</p>}
        </div>
      )}
      {message && <p role="status" className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
