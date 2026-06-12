// Синхронизация прогресса с Supabase Edge-функцией `sync`.
// Активна только если заданы env-переменные И приложение открыто в Telegram
// (нужен подписанный initData). Иначе — no-op, игра работает на localStorage.

import { getInitData } from './telegram';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type ServerProgress = {
  onboarded: boolean;
  lastShaveAt: number | null;
  streak: number;
  firstName?: string | null;
};

export type SyncPayload = {
  onboarded: boolean;
  lastShaveAt: number | null;
  streak: number;
};

export function isSyncEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON && getInitData());
}

// Отправить прогресс (и/или получить серверный). Без payload — только чтение.
export async function syncProgress(progress?: SyncPayload): Promise<ServerProgress | null> {
  if (!isSyncEnabled()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ initData: getInitData(), progress }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerProgress;
  } catch {
    return null; // сеть недоступна — тихо остаёмся на локальном прогрессе
  }
}
