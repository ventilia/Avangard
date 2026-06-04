// Тонкая обёртка над window.Telegram.WebApp.
// Безопасна вне Telegram (в обычном браузере): tg === undefined.

export const tg = window.Telegram?.WebApp;

/** Внутри настоящего Telegram-клиента? (в обычном браузере initData пустой) */
export const isTelegram = Boolean(tg && tg.initData !== '');

/** Инициализация Mini App: готовность, разворот, цвет шапки под нашу палитру. */
export function initTelegram(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
  // Подгоняем шапку/фон Telegram под пиксельную тему (если клиент умеет).
  const anyTg = tg as unknown as Record<string, (c: string) => void>;
  anyTg.setHeaderColor?.('#13170e');
  anyTg.setBackgroundColor?.('#13170e');
}

/** Тактильная отдача (вибро). Молча игнорим, если клиент не поддерживает. */
export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
  const h = (tg as unknown as { HapticFeedback?: { impactOccurred?: (k: string) => void; notificationOccurred?: (k: string) => void } } | undefined)?.HapticFeedback;
  if (!h) return;
  if (kind === 'success' || kind === 'error') h.notificationOccurred?.(kind);
  else h.impactOccurred?.(kind);
}
