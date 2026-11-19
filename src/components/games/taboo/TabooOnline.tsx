"use client";

import { navigateWithLoading } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { tabooCards } from "@/data/tabooCards";
import {
  advanceTabooTurn,
  cancelTabooRoom,
  createTabooRoom,
  getTabooLobby,
  getTabooTurnCard,
  hostFinishTabooRoom,
  joinTabooRoom,
  listTabooSlots,
  recordTabooAction,
  startTabooRoom,
} from "@/services/tabooRoomService";
import type { TabooCardData } from "@/types/taboo";
import type {
  TabooOnlineLobby,
  TabooOnlineSlotOption,
} from "@/types/taboo-online";

const CUSTOM_CARDS_KEY = "party-play-taboo-custom-cards";

type DeckSource = "default" | "custom" | "combined";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ROOM_NOT_FOUND"))
    return "Không tìm thấy phòng. Kiểm tra lại mã phòng.";
  if (message.includes("ROOM_NOT_JOINABLE"))
    return "Phòng đã bắt đầu, không thể tham gia thêm.";
  if (message.includes("ALREADY_JOINED"))
    return "Thiết bị này đã tham gia phòng.";
  if (message.includes("SLOT_ALREADY_JOINED"))
    return "Người chơi này đã có người tham gia.";
  if (message.includes("SLOTS_NOT_READY"))
    return "Mỗi người chơi hoặc đội cần có ít nhất một thành viên.";
  if (message.includes("NOT_ROOM_HOST"))
    return "Chỉ quản trò mới điều khiển lượt chơi.";
  if (message.includes("NOT_ENOUGH_CARDS_PER_SLOT"))
    return "Cần ít nhất một thẻ cho mỗi người chơi hoặc đội.";
  if (
    message.includes("PGRST202") ||
    message.includes("Could not find the function public.create_taboo_room")
  ) {
    return "Hệ thống Supabase chưa áp dụng migration phòng Taboo. Hãy áp dụng migration create_taboo_room trên project hiện tại rồi thử lại.";
  }
  return message.replaceAll("_", " ");
}

export default function TabooOnline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCodeParam = (searchParams.get("room") ?? "").trim().toUpperCase();
  const roomCode = roomCodeParam;
  const roomId = searchParams.get("id") ?? "";

  const [mode, setMode] = useState<"individual" | "team">("individual");
  const [slotNames, setSlotNames] = useState(["Người chơi 1", "Người chơi 2"]);
  const [turnDuration, setTurnDuration] = useState(60);
  const [rounds, setRounds] = useState(1);
  const [deckDistribution, setDeckDistribution] = useState<"shared" | "split">(
    "shared",
  );
  const [deckSource, setDeckSource] = useState<DeckSource>("default");
  const [customCards, setCustomCards] = useState<TabooCardData[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joinSlots, setJoinSlots] = useState<TabooOnlineSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [lobby, setLobby] = useState<TabooOnlineLobby | null>(null);
  const [card, setCard] = useState<TabooCardData | null>(null);
  const [hostCardVisible, setHostCardVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);

  const refreshLobby = useCallback(async () => {
    if (!roomId) return null;
    try {
      const next = await getTabooLobby(roomId);
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
        const next = await getTabooLobby(roomId);
        if (!active) return;
        setLobby(next);
        setError("");
        if (next.status === "playing") {
          const canViewCard =
            next.is_host || next.my_slots.includes(next.current_slot_id ?? "");
          if (canViewCard) {
            setCard(await getTabooTurnCard(roomId));
          } else {
            setCard(null);
          }
        }
      } catch (caught) {
        if (active) setError(readableError(caught));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => void load(), 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [roomId]);

  useEffect(() => {
    if (lobby?.status !== "playing") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lobby?.status]);

  useEffect(() => {
    if (!roomCode || roomId) return;
    let active = true;
    const lookup = async () => {
      setLoading(true);
      try {
        const slots = await listTabooSlots(roomCode);
        if (!active) return;
        setJoinSlots(slots);
        setSelectedSlot((current) =>
          slots.some((slot) => slot.slot_id === current)
            ? current
            : (slots[0]?.slot_id ?? ""),
        );
        setError(
          slots.length ? "" : "Không tìm thấy mục tham gia trong phòng.",
        );
      } catch (caught) {
        if (active) setError(readableError(caught));
      } finally {
        if (active) setLoading(false);
      }
    };
    void lookup();
    return () => {
      active = false;
    };
  }, [roomCode, roomId]);

  const selectedOption = useMemo(
    () => joinSlots.find((slot) => slot.slot_id === selectedSlot),
    [joinSlots, selectedSlot],
  );

  const timeRemaining = lobby?.turn_started_at
    ? now === 0
      ? lobby.turn_duration
      : Math.max(
          0,
          lobby.turn_duration -
            Math.floor(
              (now - new Date(lobby.turn_started_at).getTime()) / 1000,
            ),
        )
    : 0;

  useEffect(() => {
    if (!lobby?.is_host || lobby.status !== "playing" || timeRemaining !== 0)
      return;
    const timeout = setTimeout(() => {
      void advanceTabooTurn(lobby.id).catch((caught) =>
        setError(readableError(caught)),
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [lobby?.is_host, lobby?.status, lobby?.id, timeRemaining]);

  const handleCreate = async () => {
    const names = slotNames.map((name) => name.trim()).filter(Boolean);
    if (
      names.length !== slotNames.length ||
      new Set(names.map((name) => name.toLowerCase())).size !== names.length
    ) {
      setError("Tên người chơi hoặc đội không được để trống hoặc trùng nhau.");
      return;
    }
    const roomCards =
      deckSource === "default"
        ? tabooCards
        : deckSource === "custom"
          ? customCards
          : [...tabooCards, ...customCards];
    if (roomCards.length === 0) {
      setError("Hãy chọn bộ thẻ có ít nhất một thẻ.");
      return;
    }
    if (deckDistribution === "split" && roomCards.length < names.length) {
      setError("Cần ít nhất một thẻ cho mỗi người chơi hoặc đội.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await createTabooRoom({
        mode,
        slotNames: names,
        cards: roomCards,
        turnDuration,
        rounds,
        deckDistribution,
      });
      navigateWithLoading(() =>
        router.push(
          `/games/taboo/online?room=${created.room_code}&id=${created.room_id}`,
        ),
      );
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleLookup = () => {
    if (joinCode.trim().length !== 8) {
      setError("Mã phòng gồm 8 ký tự.");
      return;
    }
    navigateWithLoading(() =>
      router.push(`/games/taboo/online?room=${joinCode.trim().toUpperCase()}`),
    );
  };

  const handleJoin = async () => {
    if (!selectedOption) return;
    const name =
      selectedOption.mode === "individual"
        ? selectedOption.slot_name
        : playerName.trim();
    if (!name) {
      setError("Nhập tên hiển thị của bạn.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const joined = await joinTabooRoom(
        roomCode,
        selectedOption.slot_id,
        name,
      );
      navigateWithLoading(() =>
        router.replace(
          `/games/taboo/online?room=${joined.room_code}&id=${joined.room_id}`,
        ),
      );
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    if (!lobby) return;
    setBusy(true);
    setError("");
    try {
      await startTabooRoom(lobby.id);
      await refreshLobby();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (action: "correct" | "skip" | "forbidden") => {
    if (!lobby) return;
    setBusy(true);
    try {
      await recordTabooAction(lobby.id, action);
      await refreshLobby();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!lobby) return;
    setBusy(true);
    try {
      await hostFinishTabooRoom(lobby.id);
      await refreshLobby();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelRoom = async () => {
    if (!lobby) return;

    const confirmed = window.confirm(
      "Huỷ phòng này và quay lại phần thiết lập?",
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    try {
      await cancelTabooRoom(lobby.id);
      navigateWithLoading(() => router.replace("/games/taboo"));
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    const code = lobby?.room_code ?? roomCode;
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Đã sao chép mã phòng.");
    } catch {
      setNotice(`Mã phòng: ${code}`);
    }
    window.setTimeout(() => setNotice(""), 2500);
  };

  const currentSlot = lobby?.slots.find(
    (slot) => slot.id === lobby.current_slot_id,
  );
  const isCurrentPlayer = Boolean(
    lobby?.my_slots.includes(lobby?.current_slot_id ?? ""),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(CUSTOM_CARDS_KEY);
        const parsed: unknown = saved ? JSON.parse(saved) : [];

        if (Array.isArray(parsed)) {
          const validCards = parsed.filter((card): card is TabooCardData => {
            if (!card || typeof card !== "object") return false;
            const value = card as Partial<TabooCardData>;
            return (
              typeof value.id === "string" &&
              typeof value.word === "string" &&
              typeof value.category === "string" &&
              ["easy", "medium", "hard"].includes(value.difficulty ?? "") &&
              Array.isArray(value.forbiddenWords) &&
              value.forbiddenWords.every((word) => typeof word === "string")
            );
          });
          setCustomCards(validCards);
        }
      } catch {
        setCustomCards([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!active || !user || user.is_anonymous || !user.email) return;

      void supabase
        .from("taboo_custom_cards")
        .select("card")
        .order("updated_at", { ascending: false })
        .then(({ data: rows, error: loadError }) => {
          if (!active) return;
          if (loadError) return;

          const accountCards = (rows ?? [])
            .map((row) => row.card)
            .filter((card): card is TabooCardData => {
              if (!card || typeof card !== "object") return false;
              const value = card as Partial<TabooCardData>;
              return (
                typeof value.id === "string" &&
                typeof value.word === "string" &&
                typeof value.category === "string" &&
                ["easy", "medium", "hard"].includes(value.difficulty ?? "") &&
                Array.isArray(value.forbiddenWords) &&
                value.forbiddenWords.every((word) => typeof word === "string")
              );
            });

          if (accountCards.length > 0) setCustomCards(accountCards);
        });
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/games/taboo"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Thiết lập Taboo
          </Link>
          <span className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">
            Chơi trực tuyến
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          >
            {notice}
          </p>
        )}

        {lobby ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Mã phòng</p>
                <p className="text-2xl font-black tracking-[.18em] text-blue-800">
                  {lobby.room_code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800"
              >
                <Copy size={16} />
                Sao chép mã
              </button>
            </div>

            {lobby.status === "waiting" ? (
              <>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h2 className="font-bold text-slate-900">Người chơi / đội</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {lobby.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                      >
                        <span className="font-semibold text-slate-800">
                          {slot.name}
                        </span>
                        <span
                          className={`text-sm font-bold ${slot.player_count ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {slot.player_count ? "Đã tham gia" : "Đang chờ"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Người đã vào phòng
                  </h2>
                  {lobby.players.length ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {lobby.players.map((player) => (
                        <li
                          key={player.id}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800"
                        >
                          {player.display_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      Chia sẻ mã phòng để người chơi tham gia.
                    </p>
                  )}
                </div>

                {lobby.is_host ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={
                        busy ||
                        lobby.slots.some((slot) => slot.player_count < 1)
                      }
                      onClick={() => void handleStart()}
                      className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white disabled:bg-slate-300"
                    >
                      {busy ? "Đang bắt đầu..." : "Bắt đầu ván chơi"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleCancelRoom()}
                      className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      Huỷ phòng
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Đợi quản trò bắt đầu ván chơi.
                  </p>
                )}
              </>
            ) : lobby.status === "playing" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      Vòng {lobby.current_round}/{lobby.rounds}
                    </p>
                    <p className="mt-1 text-xl font-black text-blue-950">
                      Lượt: {currentSlot?.name ?? "—"}
                    </p>
                  </div>
                  <div
                    role="timer"
                    className={`font-mono text-3xl font-black ${timeRemaining <= 10 ? "text-red-600" : "text-blue-800"}`}
                  >
                    {timeRemaining === 0
                      ? "Hết giờ"
                      : `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, "0")}`}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {lobby.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`rounded-xl border px-4 py-3 ${slot.id === lobby.current_slot_id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
                    >
                      <p className="font-bold text-slate-800">{slot.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Điểm:{" "}
                        <strong className="text-slate-900">{slot.score}</strong>
                      </p>
                    </div>
                  ))}
                </div>

                {(lobby.is_host || isCurrentPlayer) && card ? (
                  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                    {lobby.is_host && (
                      <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                        <span className="inline-flex items-center gap-2 text-sm font-black text-amber-800">
                          <ShieldCheck size={17} />
                          QUẢN TRÒ XEM THẺ
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setHostCardVisible((visible) => !visible)
                          }
                          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-800"
                        >
                          {hostCardVisible ? "Ẩn thẻ" : "Hiện thẻ"}
                        </button>
                      </div>
                    )}
                    {(isCurrentPlayer ||
                      (lobby.is_host && hostCardVisible)) && (
                      <div className="p-5 text-center sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">
                          Từ cần diễn tả
                        </p>
                        <h2 className="mt-3 text-4xl font-black text-slate-900 sm:text-6xl">
                          {card.word}
                        </h2>
                        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-rose-600">
                            Từ cấm
                          </p>
                          <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {card.forbiddenWords.map((word) => (
                              <span
                                key={word}
                                className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm font-bold text-rose-700"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="font-bold text-slate-700">
                      Đang chờ lượt của bạn
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Người chơi hoặc đội đang hiện hành mới được xem thẻ.
                    </p>
                  </div>
                )}

                {(isCurrentPlayer || lobby.is_host) && (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAction("correct")}
                      className="rounded-xl bg-emerald-600 px-3 py-3 font-bold text-white"
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAction("skip")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold text-slate-700"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAction("forbidden")}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 font-bold text-rose-700"
                    >
                      Phạm luật
                    </button>
                  </div>
                )}

                {lobby.is_host && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void advanceTabooTurn(lobby.id)}
                      className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-bold text-blue-800"
                    >
                      Chuyển lượt
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleFinish()}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700"
                    >
                      Kết thúc ván
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center">
                <h2 className="text-2xl font-black text-emerald-900">
                  Ván chơi kết thúc
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {lobby.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-xl bg-white px-4 py-3"
                    >
                      <p className="font-bold text-slate-800">{slot.name}</p>
                      <p className="mt-1 text-lg font-black text-emerald-700">
                        {slot.score} điểm
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : !roomCode ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <Users className="text-blue-600" />
                Tạo phòng mới
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["individual", "team"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => {
                      setMode(value);
                      setSlotNames((items) =>
                        items.map((_, index) =>
                          value === "team"
                            ? `Đội ${index + 1}`
                            : `Người chơi ${index + 1}`,
                        ),
                      );
                    }}
                    className={`rounded-xl border p-3 text-sm font-bold ${mode === value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}
                  >
                    {value === "team" ? "Theo đội" : "Từng người"}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm font-bold text-slate-700">
                  Thời gian mỗi lượt
                  <select
                    value={turnDuration}
                    onChange={(event) =>
                      setTurnDuration(Number(event.target.value))
                    }
                    className={`${fieldClass} mt-2`}
                  >
                    {[30, 60, 90].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds} giây
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Số vòng
                  <select
                    value={rounds}
                    onChange={(event) => setRounds(Number(event.target.value))}
                    className={`${fieldClass} mt-2`}
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map(
                      (round) => (
                        <option key={round} value={round}>
                          {round} vòng
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeckDistribution("shared")}
                  className={`rounded-xl border p-3 text-sm font-bold ${deckDistribution === "shared" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}
                >
                  Bộ dùng chung
                </button>
                <button
                  type="button"
                  onClick={() => setDeckDistribution("split")}
                  className={`rounded-xl border p-3 text-sm font-bold ${deckDistribution === "split" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}
                >
                  Chia bộ câu hỏi
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["default", "Mặc định", `${tabooCards.length} thẻ`],
                    ["custom", "Bộ đã lưu", `${customCards.length} thẻ`],
                    [
                      "combined",
                      "Kết hợp",
                      `${tabooCards.length + customCards.length} thẻ`,
                    ],
                  ] as const
                ).map(([value, title, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDeckSource(value)}
                    className={`rounded-xl border p-3 text-left text-sm font-bold ${deckSource === value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}
                  >
                    <span className="block">{title}</span>
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                {slotNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={name}
                      onChange={(event) =>
                        setSlotNames((items) =>
                          items.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        )
                      }
                      maxLength={50}
                      className={`${fieldClass} py-2.5`}
                      aria-label={`${mode === "team" ? "Tên đội" : "Tên người chơi"} ${index + 1}`}
                    />
                    {slotNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSlotNames((items) =>
                            items.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {slotNames.length < (mode === "individual" ? 20 : 10) && (
                  <button
                    type="button"
                    onClick={() =>
                      setSlotNames((items) => [
                        ...items,
                        mode === "team"
                          ? `Đội ${items.length + 1}`
                          : `Người chơi ${items.length + 1}`,
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold text-blue-700"
                  >
                    <Plus size={17} />
                    Thêm {mode === "team" ? "đội" : "người chơi"}
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCreate()}
                className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white disabled:bg-slate-300"
              >
                {busy ? "Đang tạo phòng..." : "Tạo phòng và chia sẻ mã"}
              </button>
            </section>

            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-900">
                Vào phòng có sẵn
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nhập mã 8 ký tự do quản trò chia sẻ.
              </p>
              <label className="mt-5 block text-sm font-bold text-slate-700">
                Mã phòng
                <input
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-F0-9]/g, "")
                        .slice(0, 8),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleLookup();
                  }}
                  className={`${fieldClass} mt-2 font-mono uppercase tracking-[.2em]`}
                  placeholder="A1B2C3D4"
                />
              </label>
              <button
                type="button"
                onClick={handleLookup}
                className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-bold text-blue-800"
              >
                Tìm phòng
              </button>
            </section>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black text-slate-900">
              Tham gia phòng {roomCode}
            </h2>
            {loading && !joinSlots.length ? (
              <div className="mt-5 flex items-center gap-2 text-slate-500">
                <LoaderCircle className="animate-spin" />
                Đang tải phòng...
              </div>
            ) : null}
            {joinSlots.length > 0 && (
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-bold text-slate-700">
                  Chọn người chơi / đội
                  <select
                    value={selectedSlot}
                    onChange={(event) => {
                      setSelectedSlot(event.target.value);
                      setPlayerName("");
                    }}
                    className={`${fieldClass} mt-2`}
                  >
                    {joinSlots.map((slot) => (
                      <option key={slot.slot_id} value={slot.slot_id}>
                        {slot.slot_name}
                        {slot.mode === "team" ? " · đội" : " · người chơi"}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedOption?.mode === "team" ? (
                  <label className="block text-sm font-bold text-slate-700">
                    Tên hiển thị của bạn
                    <input
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      maxLength={40}
                      className={`${fieldClass} mt-2`}
                      placeholder="Ví dụ: Minh"
                    />
                  </label>
                ) : (
                  <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Bạn sẽ tham gia với tên{" "}
                    <strong>{selectedOption?.slot_name}</strong>.
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy || !selectedOption}
                  onClick={() => void handleJoin()}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white disabled:bg-slate-300"
                >
                  {busy ? "Đang vào phòng..." : "Vào phòng"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
