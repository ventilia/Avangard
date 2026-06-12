-- Игроки и их прогресс. Доступ — только через Edge-функцию (service role),
-- поэтому RLS включён, а публичных политик нет: anon-клиент к таблице не лезет.

create table if not exists public.players (
  telegram_id   bigint primary key,
  first_name    text,
  username      text,
  onboarded     boolean     not null default false,
  last_shave_at bigint,                       -- ms-таймстамп с клиента
  streak        integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.players enable row level security;

-- Лидерборд по стрику (читается через функцию service role'ом).
create index if not exists players_streak_idx on public.players (streak desc);
