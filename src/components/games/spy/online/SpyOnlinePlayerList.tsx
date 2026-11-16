import { Crown, UserRound, CheckCircle2 } from "lucide-react";

import type { SpyRoomPlayer } from "@/types/spy-online";

interface Props {
  players: SpyRoomPlayer[];
  currentPlayerId: string;
}

const AVATAR_STYLES = [
  "bg-blue-100 text-blue-600",
  "bg-blue-100 text-blue-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

export default function SpyOnlinePlayerList({
  players,
  currentPlayerId,
}: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
        <UsersPlaceholder />

        <p className="mt-3 text-sm font-medium text-gray-500">
          Chưa có người chơi nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => {
        const isMe = player.id === currentPlayerId;
        const avatarStyle = AVATAR_STYLES[index % AVATAR_STYLES.length];

        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
              isMe
                ? "border-blue-200 bg-blue-50/70"
                : "border-gray-100 bg-gray-50/70 hover:border-gray-200"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${avatarStyle}`}
            >
              <UserRound size={21} />
            </div>

            {/* Player information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold text-gray-900">
                  {player.player_name}
                </span>

                {isMe && (
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    BẠN
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Người chơi {index + 1}
              </p>
            </div>

            {/* Host badge */}
            {player.is_host && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                <Crown size={14} />
                Quản trò
              </div>
            )}

            {!player.is_host && (
              <div className="flex shrink-0 items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={15} />
                <span className="hidden sm:inline">Đã vào</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
      <UserRound size={24} />
    </div>
  );
}
