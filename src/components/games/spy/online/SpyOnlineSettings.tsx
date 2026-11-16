"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Library,
  Plus,
  Settings2,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import type { SpyWordPair, SpyWordSource } from "@/types/spy";
import { spyCategories } from "@/data/spyWords";

export const SPY_ONLINE_SETTINGS_KEY = "party-play-spy-online-settings";
export const SPY_CUSTOM_WORDS_KEY = "party-play-spy-custom-words";

export type SpyOnlineSettingsValue = {
  spyCount: number;
  mode: "different-word" | "no-word";
  category: string;
  discussionMinutes: number;
  wordSource: SpyWordSource;
  customWordPairs: SpyWordPair[];
  spyCanSeeRole: boolean;
};

interface Props {
  playerCount: number | null;
  settings: SpyOnlineSettingsValue;
  onChange: (settings: SpyOnlineSettingsValue) => void;
  disabled?: boolean;
}

export default function SpyOnlineSettings({
  playerCount,
  settings,
  onChange,
  disabled = false,
}: Props) {
  const [newCategory, setNewCategory] = useState("Đồ ăn");
  const [newWord, setNewWord] = useState("");
  const [newSpyWord, setNewSpyWord] = useState("");
  const [wordError, setWordError] = useState("");
  const maxSpyCount = playerCount === null ? 4 : Math.max(1, Math.floor(playerCount / 3));
  const categories = [...new Set([...spyCategories, ...settings.customWordPairs.map((pair) => pair.category)])];
  const customCount = settings.customWordPairs.length;

  const addCustomWord = (id: string) => {
    const category = newCategory.trim();
    const word = newWord.trim();
    const spyWord = newSpyWord.trim();
    if (!category || !word || !spyWord) {
      setWordError("Nhập chủ đề và đủ hai từ khóa.");
      return;
    }
    if (word.toLocaleLowerCase() === spyWord.toLocaleLowerCase()) {
      setWordError("Hai từ khóa phải khác nhau.");
      return;
    }
    const duplicate = settings.customWordPairs.some(
      (pair) => pair.word.toLocaleLowerCase() === word.toLocaleLowerCase()
        && pair.spyWord.toLocaleLowerCase() === spyWord.toLocaleLowerCase(),
    );
    if (duplicate) {
      setWordError("Cặp từ này đã có trong danh sách.");
      return;
    }

    update({
      customWordPairs: [
        ...settings.customWordPairs,
        { id, category, word, spyWord },
      ],
    });
    setNewWord("");
    setNewSpyWord("");
    setWordError("");
  };

  const update = (partial: Partial<SpyOnlineSettingsValue>) => {
    onChange({
      ...settings,
      ...partial,
    });
  };

  return (
    <div className="space-y-7">
      {/* Spy count */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Users size={20} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Số lượng gián điệp</h3>
            <p className="text-xs text-gray-500">
              Có bao nhiêu kẻ giả mạo trong phòng?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="text-2xl font-black text-blue-700">
              {settings.spyCount}
            </p>
            <p className="text-xs text-gray-500">gián điệp</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={disabled || settings.spyCount <= 1}
              onClick={() =>
                update({
                  spyCount: Math.max(1, settings.spyCount - 1),
                })
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
            >
              −
            </button>

            <span className="min-w-6 text-center font-bold text-gray-900">
              {settings.spyCount}
            </span>

            <button
              disabled={disabled || settings.spyCount >= maxSpyCount}
              onClick={() =>
                update({
                  spyCount: Math.min(maxSpyCount, settings.spyCount + 1),
                })
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          {playerCount === null
            ? `Có thể chọn tối đa ${maxSpyCount} gián điệp; giới hạn cuối sẽ theo số người vào phòng.`
            : `Tối đa ${maxSpyCount} gián điệp với ${playerCount} người chơi.`}
        </p>
      </section>

      {/* Game mode */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Eye size={20} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Chế độ chơi</h3>
            <p className="text-xs text-gray-500">
              Chọn cách gián điệp nhận thông tin.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            disabled={disabled}
            onClick={() => update({ mode: "different-word" })}
            className={`rounded-2xl border p-4 text-left transition ${
              settings.mode === "different-word"
                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">Khác từ</span>

              <span
                className={`h-4 w-4 rounded-full border-4 ${
                  settings.mode === "different-word"
                    ? "border-blue-600"
                    : "border-gray-300"
                }`}
              />
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Dân thường nhận một từ khóa, còn gián điệp nhận một từ khác có liên quan.
            </p>
          </button>

          <button
            disabled={disabled}
            onClick={() => update({ mode: "no-word" })}
            className={`rounded-2xl border p-4 text-left transition ${
              settings.mode === "no-word"
                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">Không có từ</span>

              <span
                className={`h-4 w-4 rounded-full border-4 ${
                  settings.mode === "no-word"
                    ? "border-blue-600"
                    : "border-gray-300"
                }`}
              />
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Chỉ dân thường biết từ khóa. Gián điệp phải tự suy luận qua câu trả lời.
            </p>
          </button>
        </div>
      </section>

      {/* Category */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Settings2 size={20} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Chủ đề từ khóa</h3>
            <p className="text-xs text-gray-500">Chọn chủ đề cho ván chơi.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              disabled={disabled}
              onClick={() => update({ category })}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                settings.category === category
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Spy role visibility */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            {settings.spyCanSeeRole ? <Eye size={20} /> : <EyeOff size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Hiển thị vai trò gián điệp</h3>
            <p className="text-xs text-gray-500">Chọn có hiện nhãn “Bạn là gián điệp” trên màn hình riêng hay không.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
              { value: true, title: "Hiện vai trò", description: "Người giữ vai trò gián điệp được thông báo rõ." },
              { value: false, title: "Ẩn nhãn vai trò", description: "Gián điệp chỉ thấy từ khóa hoặc nhiệm vụ, không hiện nhãn vai trò." },
          ].map((option) => (
            <button
              key={String(option.value)}
              disabled={disabled}
              onClick={() => update({ spyCanSeeRole: option.value })}
              className={`rounded-2xl border p-4 text-left transition ${settings.spyCanSeeRole === option.value ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <span className="font-bold text-gray-900">{option.title}</span>
              <p className="mt-2 text-xs leading-5 text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Discussion time */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Clock3 size={20} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Thời gian thảo luận</h3>
            <p className="text-xs text-gray-500">
              Thời gian để mọi người tìm ra gián điệp.
            </p>
          </div>
        </div>

        <label className="flex max-w-xs items-center gap-3 text-sm font-semibold text-gray-700">
          <input
            type="number"
            min={1}
            max={120}
            step={1}
            value={settings.discussionMinutes}
            disabled={disabled}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isInteger(value) && value >= 1 && value <= 120) update({ discussionMinutes: value });
            }}
            aria-label="Thời gian thảo luận tính bằng phút"
            className="h-12 w-32 rounded-xl border border-gray-200 bg-white px-4 text-base font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
          />
          phút
        </label>
      </section>

      {/* Word source and custom word pairs */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Library size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Nguồn từ khóa</h3>
            <p className="text-xs text-gray-500">Dùng danh sách có sẵn, từ tự tạo hoặc kết hợp cả hai.</p>
          </div>
        </div>

        <div className="space-y-2">
          {([
            ["default", "Từ khóa mặc định", "Danh sách từ có sẵn trong trò chơi."],
            ["custom", "Từ khóa tự tạo", `${customCount} cặp từ trong danh sách riêng.`],
            ["all", "Kết hợp tất cả", "Chọn ngẫu nhiên từ danh sách mặc định và từ tự tạo."],
          ] as const).map(([value, title, description]) => (
            <button
              key={value}
              disabled={disabled}
              onClick={() => update({ wordSource: value as SpyWordSource })}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${settings.wordSource === value ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${settings.wordSource === value ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"}`}>
                {settings.wordSource === value && <Check size={13} />}
              </span>
              <span>
                <span className="block font-bold text-gray-900">{title}</span>
                <span className="mt-1 block text-xs text-gray-500">{description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={17} className="text-blue-600" />
            <p className="font-bold text-gray-900">Thêm cặp từ riêng</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} maxLength={30} placeholder="Chủ đề" disabled={disabled} className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-50" />
            <input value={newWord} onChange={(event) => setNewWord(event.target.value)} maxLength={50} placeholder="Từ khóa dân thường" disabled={disabled} className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-50" />
            <input value={newSpyWord} onChange={(event) => setNewSpyWord(event.target.value)} maxLength={50} placeholder="Từ khóa gián điệp" disabled={disabled} className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-50" />
          </div>
          {wordError && <p role="alert" className="mt-2 text-xs text-red-600">{wordError}</p>}
          <button type="button" onClick={() => addCustomWord(`online-${crypto.randomUUID()}`)} disabled={disabled} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Plus size={16} /> Thêm cặp từ
          </button>

          {settings.customWordPairs.length > 0 && (
            <ul className="mt-4 max-h-52 space-y-2 overflow-y-auto">
              {settings.customWordPairs.map((pair) => (
                <li key={pair.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                    <span className="font-semibold">{pair.category}:</span> {pair.word} / {pair.spyWord}
                  </span>
                  <button type="button" disabled={disabled} onClick={() => update({ customWordPairs: settings.customWordPairs.filter((item) => item.id !== pair.id) })} aria-label={`Xóa cặp từ ${pair.word}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <Zap size={18} className="mt-0.5 shrink-0 text-amber-600" />

        <p className="text-xs leading-5 text-amber-800">
          Cấu hình sẽ áp dụng cho cả phòng. Từ khóa tự tạo được lưu trên trình duyệt này.
        </p>
      </div>
    </div>
  );
}
