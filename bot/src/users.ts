// Работа с пользователями и их прогрессом.
// Пока — in-memory заглушка; позже заменить на БД (SQLite/Postgres/KV).

export type UserProgress = {
  userId: number;
  lastShaveAt: number | null; // timestamp последнего бритья
  onboarded: boolean;
  updatedAt: number;
};

const store = new Map<number, UserProgress>();

export function getProgress(userId: number): UserProgress {
  let p = store.get(userId);
  if (!p) {
    p = { userId, lastShaveAt: null, onboarded: false, updatedAt: Date.now() };
    store.set(userId, p);
  }
  return p;
}

export function saveProgress(progress: UserProgress): void {
  store.set(progress.userId, { ...progress, updatedAt: Date.now() });
}
