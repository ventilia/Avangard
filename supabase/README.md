# Деплой бэкенда на Supabase

Бесплатно: БД (Postgres) + Edge-функция `sync` (валидация Telegram `initData` +
сохранение прогресса). Веб остаётся на GitHub Pages.

## Что уже готово в репо
- `supabase/migrations/…_players.sql` — таблица `players` (+ RLS, индекс по стрику).
- `supabase/functions/sync/index.ts` — функция синхронизации прогресса.
- `src/api.ts` — фронтовый клиент (активен только если заданы env + открыто в TG).

## Шаги (один раз)

1. **Проект.** Зарегистрируйся на supabase.com → New project. Запомни **Project Ref**
   (в URL дашборда) и пароль БД.

2. **CLI.**
   ```bash
   npm i -g supabase
   supabase login            # откроет браузер
   cd C:\Users\GAMER\WebstormProjects\Avangard
   supabase link --project-ref <PROJECT_REF>
   ```

3. **Схема БД.**
   ```bash
   supabase db push          # применит миграцию players
   ```

4. **Секрет бота** (токен от @BotFather):
   ```bash
   supabase secrets set BOT_TOKEN=123456:ABC...
   ```
   `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase подставит сам.

5. **Функция.**
   ```bash
   supabase functions deploy sync
   ```

6. **Ключи для фронта.** Дашборд → Project Settings → API: возьми **Project URL** и
   **anon public** ключ. Положи в `.env` (локально) по образцу `.env.example`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

7. **Прод-сборка (GitHub Pages).** Vite вшивает `VITE_*` на этапе сборки, поэтому
   добавь эти переменные в GitHub Actions: репо → Settings → Secrets and variables →
   Actions → добавь `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, и в
   `.github/workflows/deploy.yml` на шаге `pnpm build` прокинь их в env:
   ```yaml
   - run: pnpm build
     env:
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
   ```

8. **Бот → Mini App.** У @BotFather привяжи URL Pages как Web App (кнопка/меню),
   чтобы бот открывал приложение.

## Проверка
- Открой Mini App из Telegram → побрей Олега.
- Дашборд Supabase → Table editor → `players`: появилась строка с твоим
  `telegram_id`, `onboarded`, `last_shave_at`. Прогресс синкается между устройствами.
- Локально/вне Telegram синк выключен (нет `initData`) — игра работает на localStorage.

## Дальше (отдельные шаги)
- Функция `leaderboard` (топ по стрику) — когда сделаем стрик.
- Cron-напоминания «щетина отросла» (Supabase Scheduled / pg_cron).
- Стрик в `progress` уже передаётся (пока 0) — поле в БД готово.
