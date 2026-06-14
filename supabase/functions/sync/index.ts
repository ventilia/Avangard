// Edge-функция Supabase: синхронизация прогресса игрока.
// Оптимизирована под минимальную нагрузку:
//  - SELECT → если данные не новее клиентских, просто возвращаем cached-данные без UPDATE.
//  - Upsert только когда есть реальный прирост (lastShaveAt увеличился или onboarded стал true).
//
// Деплой: supabase functions deploy sync
// Секрет:  supabase secrets set BOT_TOKEN=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

async function hmac(key: Uint8Array, msg: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
}

type TgUser = { id?: number; first_name?: string; username?: string };

async function validateInitData(initData: string, botToken: string): Promise<TgUser | null> {
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');

  const pairs = [...p.entries()]
    .filter(([k]) => k !== 'signature')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');

  const secret = await hmac(new TextEncoder().encode('WebAppData'), botToken);
  const sig = await hmac(secret, dataCheckString);
  const hex = [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex !== hash) return null;

  const authDate = Number(p.get('auth_date') ?? 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  try {
    return JSON.parse(p.get('user') ?? '{}') as TgUser;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const botToken = Deno.env.get('BOT_TOKEN');
  if (!botToken) return json({ error: 'BOT_TOKEN not set' }, 500);

  let body: {
    initData?: string;
    progress?: { onboarded?: boolean; lastShaveAt?: number | null; streak?: number };
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  const user = await validateInitData(body.initData ?? '', botToken);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Читаем текущую запись ─────────────────────────────────────────────────
  const { data: existing } = await db
    .from('players')
    .select('*')
    .eq('telegram_id', user.id)
    .maybeSingle();

  const inc = body.progress;

  // Мёрж: берём максимальные значения между сервером и клиентом.
  const mergedOnboarded = Boolean(existing?.onboarded) || Boolean(inc?.onboarded);
  const mergedLastShave = Math.max(existing?.last_shave_at ?? 0, inc?.lastShaveAt ?? 0) || null;
  const mergedStreak = Math.max(existing?.streak ?? 0, inc?.streak ?? 0);

  // ── Оптимизация: пропускаем запись если ничего не изменилось ─────────────
  const noChange =
    existing &&
    Boolean(existing.onboarded) === mergedOnboarded &&
    (existing.last_shave_at ?? 0) === (mergedLastShave ?? 0) &&
    (existing.streak ?? 0) === mergedStreak;

  if (noChange) {
    // Данные совпадают — возвращаем кешированный результат без записи в БД.
    return json({
      onboarded: existing.onboarded,
      lastShaveAt: existing.last_shave_at,
      streak: existing.streak,
      firstName: existing.first_name,
    });
  }

  // ── Запись только при реальных изменениях ─────────────────────────────────
  const merged = {
    telegram_id: user.id,
    first_name: user.first_name ?? existing?.first_name ?? null,
    username: user.username ?? existing?.username ?? null,
    onboarded: mergedOnboarded,
    last_shave_at: mergedLastShave,
    streak: mergedStreak,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await db
    .from('players')
    .upsert(merged)
    .select()
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);

  return json({
    onboarded: saved!.onboarded,
    lastShaveAt: saved!.last_shave_at,
    streak: saved!.streak,
    firstName: saved!.first_name,
  });
});
