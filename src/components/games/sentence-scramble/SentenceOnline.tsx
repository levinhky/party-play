"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, LoaderCircle, Plus, Users, UserRound, X } from "lucide-react";
import SentencePaper from "@/components/games/sentence-scramble/SentencePaper";
import {
  createSentenceScrambleRoom,
  getMySentenceScrambleAssignments,
  getSentenceScrambleLobby,
  joinSentenceScrambleRoom,
  listSentenceScrambleTargets,
  markSentenceScrambleAnswersViewed,
  finishSentenceScrambleTarget,
  hostFinishSentenceScrambleRoom,
  startSentenceScrambleRoom,
} from "@/services/sentenceScrambleRoomService";
import type {
  SentenceScrambleOnlineMode,
  SentenceScrambleRoomLobby,
  SentenceScrambleRoomTargetOption,
  SentenceScrambleTargetDraft,
} from "@/types/sentence-scramble-online";
import type { SentenceQuestion } from "@/types/sentence-scramble";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ROOM_NOT_FOUND")) return "Không tìm thấy phòng. Hãy kiểm tra mã phòng.";
  if (message.includes("ROOM_NOT_JOINABLE")) return "Ván chơi đã bắt đầu, không thể tham gia thêm.";
  if (message.includes("ALREADY_JOINED")) return "Tài khoản này đã tham gia phòng.";
  if (message.includes("TARGET_ALREADY_JOINED")) return "Người chơi này đã được chọn.";
  if (message.includes("PLAYER_NAME_MUST_MATCH_TARGET")) return "Tên người chơi phải trùng với tên quản trò đã đặt.";
  if (message.includes("TARGETS_NOT_READY")) return "Mỗi đội/người chơi cần có người tham gia trước khi bắt đầu.";
  if (message.includes("NOT_ROOM_MEMBER")) return "Bạn chưa tham gia phòng này.";
  return message.replaceAll("_", " ");
}

function blankTarget(index: number): SentenceScrambleTargetDraft {
  return { name: `Đội ${index + 1}`, sentences: [""] };
}

export default function SentenceOnline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = (searchParams.get("room") ?? "").trim().toUpperCase();
  const roomId = searchParams.get("id") ?? "";
  const [mode, setMode] = useState<SentenceScrambleOnlineMode>("team");
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [targets, setTargets] = useState<SentenceScrambleTargetDraft[]>([blankTarget(0), blankTarget(1)]);
  const [joinCode, setJoinCode] = useState("");
  const [joinTargets, setJoinTargets] = useState<SentenceScrambleRoomTargetOption[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [lobby, setLobby] = useState<SentenceScrambleRoomLobby | null>(null);
  const [questions, setQuestions] = useState<SentenceQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);

  const refreshLobby = useCallback(async () => {
    if (!roomId) return;
    try {
      const next = await getSentenceScrambleLobby(roomId);
      setLobby(next);
      setError("");
      return next;
    } catch (caught) {
      setError(readableError(caught));
      return null;
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSentenceScrambleLobby(roomId);
        if (!active) return;
        if (data.status === "finished") {
          navigateWithLoading(() => router.replace("/games/sentence-scramble"));
          return;
        }
        setLobby(data);
        setError("");
        if (data.status === "playing" && data.my_players.length) {
          const assignments = await getMySentenceScrambleAssignments(roomId, data.my_players.map((player) => player.slot_id));
          if (!active) return;
          const assigned = assignments.flatMap((assignment) => {
            const target = data.targets.find((item) => item.id === assignment.slot_id);
            return assignment.sentences.map((sentence, index): SentenceQuestion => ({
              id: `${assignment.slot_id}-${index}`,
              sentence,
              translation: "",
              difficulty: "medium",
              category: target?.name ?? "Lượt của bạn",
              hint: "",
            }));
          });
          setQuestions(assigned);
        }
      } catch (caught) {
        if (active) setError(readableError(caught));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => void load(), 2500);
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [roomId, router]);

  useEffect(() => {
    if (lobby?.status !== "playing") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lobby?.status]);

  const timeRemainingSeconds = (() => {
    if (!lobby?.started_at || !now || !lobby.time_limit_minutes) return null;
    const endsAt = new Date(lobby.started_at).getTime() + lobby.time_limit_minutes * 60_000;
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  })();

  useEffect(() => {
    if (!roomCode || roomId) return;
    let active = true;
    const lookup = async () => {
      setLoading(true);
      try {
        const options = await listSentenceScrambleTargets(roomCode);
        if (!active) return;
        setJoinTargets(options);
        setSelectedTarget((current) => options.some((option) => option.slot_id === current) ? current : options[0]?.slot_id ?? "");
        setError(options.length ? "" : "Không có mục tham gia nào; phòng có thể đã bắt đầu hoặc mã chưa đúng.");
      } catch (caught) {
        if (active) setError(readableError(caught));
      } finally {
        if (active) setLoading(false);
      }
    };
    void lookup();
    return () => { active = false; };
  }, [roomCode, roomId]);

  const selectedOption = useMemo(() => joinTargets.find((item) => item.slot_id === selectedTarget), [joinTargets, selectedTarget]);

  const handleCreate = async () => {
    const normalized = targets.map((target) => ({
      name: target.name.trim(),
      sentences: target.sentences.map((sentence) => sentence.trim()).filter(Boolean),
    }));
    if (normalized.some((target) => !target.name || target.sentences.length === 0)) {
      setError("Mỗi đội/người chơi cần có tên và ít nhất một câu.");
      return;
    }
    setBusy(true); setError("");
    try {
      const created = await createSentenceScrambleRoom(mode, normalized, durationMinutes);
      navigateWithLoading(() => router.push(`/games/sentence-scramble/online?room=${created.room_code}&id=${created.room_id}`));
    } catch (caught) { setError(readableError(caught)); }
    finally { setBusy(false); }
  };

  const handleLookup = async () => {
    if (joinCode.trim().length !== 8) { setError("Mã phòng gồm 8 ký tự."); return; }
    setError("");
    navigateWithLoading(() => router.push(`/games/sentence-scramble/online?room=${joinCode.trim().toUpperCase()}`));
  };

  const handleJoin = async () => {
    if (!selectedOption) return;
    const name = selectedOption.mode === "individual" ? selectedOption.slot_name : playerName.trim();
    if (!name) { setError("Nhập tên người chơi của bạn."); return; }
    setBusy(true); setError("");
    try {
      const joined = await joinSentenceScrambleRoom(roomCode, selectedOption.slot_id, name);
      navigateWithLoading(() => router.replace(`/games/sentence-scramble/online?room=${joined.room_code}&id=${joined.room_id}`));
    } catch (caught) { setError(readableError(caught)); }
    finally { setBusy(false); }
  };

  const handleStart = async () => {
    if (!lobby) return;
    setBusy(true); setError("");
    try { await startSentenceScrambleRoom(lobby.id); await refreshLobby(); }
    catch (caught) { setError(readableError(caught)); }
    finally { setBusy(false); }
  };

  const handleAnswersViewed = async () => {
    if (!roomId) return;
    try {
      await markSentenceScrambleAnswersViewed(roomId);
      await refreshLobby();
    } catch (caught) { setError(readableError(caught)); }
  };

  const handleFinish = async () => {
    if (!roomId) return;
    setBusy(true); setError("");
    try {
      const result = await finishSentenceScrambleTarget(roomId);
      if (result.status === "finished") {
        navigateWithLoading(() => router.replace("/games/sentence-scramble"));
        return;
      }
      await refreshLobby();
    } catch (caught) { setError(readableError(caught)); }
    finally { setBusy(false); }
  };

  const handleHostFinishEarly = async () => {
    if (!roomId) return;
    setBusy(true); setError("");
    try {
      await hostFinishSentenceScrambleRoom(roomId);
      navigateWithLoading(() => router.replace("/games/sentence-scramble"));
    } catch (caught) { setError(readableError(caught)); }
    finally { setBusy(false); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(lobby?.room_code ?? roomCode); setNotice("Đã sao chép mã phòng."); }
    catch { setNotice(`Mã phòng: ${lobby?.room_code ?? roomCode}`); }
    window.setTimeout(() => setNotice(""), 2500);
  };

  if (questions && questions.length > 0) {
    const mySlotIds = new Set(lobby?.my_players.map((player) => player.slot_id) ?? []);
    const isFinished = Boolean(lobby?.targets.filter((target) => mySlotIds.has(target.id)).every((target) => target.finished));
    return <SentencePaper questions={questions} onBack={() => setQuestions(null)} timeRemainingSeconds={timeRemainingSeconds} onAnswersViewed={() => void handleAnswersViewed()} onFinish={() => void handleFinish()} isFinished={isFinished || busy} />;
  }

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/games" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:text-blue-700"><ArrowLeft size={17} />Danh sách trò chơi</Link>
          <span className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Chơi trực tuyến · Giấy bút</span>
        </div>
        <header className="mb-6 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-700 p-6 text-white shadow-lg sm:p-6">
          <p className="text-sm font-semibold text-blue-100">Sentence Scramble</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">Mỗi đội một bộ câu</h1>
          <p className="mt-3 max-w-2xl leading-6 text-blue-100">Quản trò chuẩn bị câu riêng cho từng đội hoặc người chơi. Khi quản trò bắt đầu, mỗi người chỉ nhận bộ câu được giao cho mình.</p>
        </header>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p>}

        {loading && !lobby && roomId ? <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-slate-500"><LoaderCircle className="animate-spin" />Đang kết nối phòng...</div> : null}

        {lobby && (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm text-slate-500">Mã phòng</p><p className="text-2xl font-black tracking-[.18em] text-blue-800">{lobby.room_code}</p></div>
              <button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800"><Copy size={16} />Sao chép mã</button>
            </div>
            {lobby.status === "waiting" ? <>
              <div className="rounded-2xl bg-slate-50 p-4"><h2 className="font-bold text-slate-900">Các đội / người chơi</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{lobby.targets.map((target) => <div key={target.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3"><span className="font-semibold text-slate-800">{target.name}</span><span className={`text-sm font-bold ${target.player_count ? "text-emerald-600" : "text-amber-600"}`}>{target.player_count ? "Đã tham gia" : "Đang chờ"}</span></div>)}</div></div>
              <div><h2 className="font-bold text-slate-900">Người đã vào phòng</h2>{lobby.players.length ? <ul className="mt-2 flex flex-wrap gap-2">{lobby.players.map((player) => <li key={player.id} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">{player.display_name} · {player.target_name}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chia sẻ mã phòng để người chơi vào.</p>}</div>
              {lobby.is_host && <button type="button" disabled={busy || lobby.targets.some((target) => target.player_count < 1)} onClick={() => void handleStart()} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? "Đang bắt đầu..." : "Bắt đầu ván chơi"}</button>}
              {!lobby.is_host && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Đợi quản trò bắt đầu. Hệ thống sẽ tự chuyển sang bộ câu của bạn.</p>}
            </> : lobby.is_host ? <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4"><div><p className="font-bold text-blue-950">Ván chơi đang diễn ra</p><p className="mt-1 text-sm text-blue-800">Thời lượng: {lobby.time_limit_minutes} phút</p></div><span role="timer" className={`text-xl font-black ${timeRemainingSeconds !== null && timeRemainingSeconds <= 60 ? "text-red-700" : "text-blue-800"}`}>{timeRemainingSeconds === null ? "--:--" : timeRemainingSeconds === 0 ? "Hết giờ" : `${Math.floor(timeRemainingSeconds / 60)}:${String(timeRemainingSeconds % 60).padStart(2, "0")}`}</span></div>
              <div className="space-y-2">{lobby.targets.map((target) => <div key={target.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3"><span className="font-semibold text-slate-800">{target.name}</span><div className="flex flex-wrap gap-2 text-xs font-bold"><span className={`rounded-full px-3 py-1 ${target.answer_viewed ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{target.answer_viewed ? "Đã xem đáp án" : "Chưa xem đáp án"}</span><span className={`rounded-full px-3 py-1 ${target.finished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{target.finished ? "Đã kết thúc" : "Đang chơi"}</span></div></div>)}</div>
              <p className="text-sm text-slate-500">Bảng trạng thái tự cập nhật. Khi mọi đội/người chơi kết thúc, tất cả sẽ được đưa về màn hình Sentence Scramble.</p>
              <button type="button" disabled={busy} onClick={() => void handleHostFinishEarly()} className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">{busy ? "Đang kết thúc..." : "Quản trò kết thúc ván sớm"}</button>
            </div> : lobby.my_players.length ? <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900"><p className="font-bold">Ván chơi đã bắt đầu</p><p className="mt-1 text-sm">Đang tải bộ câu được giao cho bạn...</p></div> : <div className="rounded-2xl bg-amber-50 p-5 text-amber-900"><p className="font-bold">Ván chơi đã bắt đầu</p><p className="mt-1 text-sm">Bạn là quản trò nhưng chưa tham gia như một người chơi. Các đội đã nhận bộ câu riêng.</p></div>}
          </section>
        )}

        {!lobby && roomCode && !roomId && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black text-slate-900">Tham gia phòng {roomCode}</h2>
          {joinTargets.length > 0 && <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700">Chọn đội / người chơi<select value={selectedTarget} onChange={(event) => { setSelectedTarget(event.target.value); setPlayerName(""); }} className={`${fieldClass} mt-2`}>{joinTargets.map((option) => <option key={option.slot_id} value={option.slot_id}>{option.slot_name}{option.mode === "team" ? " · đội" : " · người chơi"}</option>)}</select></label>
            {selectedOption?.mode === "team" ? <label className="block text-sm font-bold text-slate-700">Tên hiển thị của bạn<input value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={40} className={`${fieldClass} mt-2`} placeholder="Ví dụ: Minh" /></label> : <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Bạn sẽ tham gia với tên <strong>{selectedOption?.slot_name}</strong>.</p>}
            <button type="button" disabled={busy || !selectedOption} onClick={() => void handleJoin()} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">{busy ? "Đang vào phòng..." : "Vào phòng"}</button>
          </div>}
        </section>}

        {!lobby && !roomCode && <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><Users className="text-blue-600" />Tạo phòng mới</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">{(["team", "individual"] as const).map((value) => <button type="button" key={value} onClick={() => { setMode(value); setTargets((items) => items.map((item, index) => ({ ...item, name: value === "team" ? `Đội ${index + 1}` : `Người chơi ${index + 1}` }))); }} className={`rounded-xl border p-3 text-sm font-bold ${mode === value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}>{value === "team" ? <><Users className="mr-1 inline" size={16} /> Theo đội</> : <><UserRound className="mr-1 inline" size={16} /> Từng người</>}</button>)}</div>
            <label className="mt-4 block text-sm font-bold text-slate-700">Thời gian chơi<select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className={`${fieldClass} mt-2`}>
              {[1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}
            </select></label>
            <div className="mt-5 space-y-4">{targets.map((target, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2"><input value={target.name} onChange={(event) => setTargets((items) => items.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} maxLength={50} aria-label={`Tên ${mode === "team" ? "đội" : "người chơi"} ${index + 1}`} className={`${fieldClass} py-2.5`} placeholder={mode === "team" ? `Tên đội ${index + 1}` : `Tên người chơi ${index + 1}`} />{targets.length > 2 && <button type="button" aria-label={`Xóa mục ${index + 1}`} onClick={() => setTargets((items) => items.filter((_, i) => i !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={18} /></button>}</div>
              <label className="block text-xs font-bold text-slate-600">Câu dành riêng cho mục này <span className="font-normal">(mỗi dòng một câu)</span><textarea rows={4} maxLength={20000} value={target.sentences.join("\n")} onChange={(event) => setTargets((items) => items.map((item, i) => i === index ? { ...item, sentences: event.target.value.split("\n") } : item))} className={`${fieldClass} mt-2 resize-y text-sm font-normal`} placeholder={"She reads books every night.\nWe are going to the park."} /></label>
              <p className="mt-1 text-right text-xs text-slate-400">{target.sentences.filter((line) => line.trim()).length} câu</p>
            </article>)}</div>
            <button type="button" disabled={targets.length >= 16} onClick={() => setTargets((items) => [...items, { ...blankTarget(items.length), name: mode === "team" ? `Đội ${items.length + 1}` : `Người chơi ${items.length + 1}` }])} className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold text-blue-700 disabled:text-slate-300"><Plus size={17} />Thêm {mode === "team" ? "đội" : "người chơi"}</button>
            <button type="button" disabled={busy} onClick={() => void handleCreate()} className="mt-3 w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">{busy ? "Đang tạo phòng..." : "Tạo phòng và chia sẻ mã"}</button>
          </section>
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black text-slate-900">Vào phòng có sẵn</h2><p className="mt-2 text-sm leading-6 text-slate-500">Nhập mã 8 ký tự do quản trò chia sẻ. Bạn sẽ chọn đội/người chơi để nhận bộ câu tương ứng.</p><label className="mt-5 block text-sm font-bold text-slate-700">Mã phòng<input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8))} onKeyDown={(event) => { if (event.key === "Enter") void handleLookup(); }} className={`${fieldClass} mt-2 font-mono uppercase tracking-[.2em]`} placeholder="A1B2C3D4" /></label><button type="button" onClick={() => void handleLookup()} className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-bold text-blue-800 hover:bg-blue-100">Tìm phòng</button></section>
        </div>}
      </div>
    </main>
  );
}
