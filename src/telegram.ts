// Тонкая обёртка над window.Telegram.WebApp.
// Безопасна вне Telegram (например, в обычном браузере при разработке): tg === undefined.

export const tg = window.Telegram?.WebApp;

/** Внутри настоящего Telegram-клиента? (в обычном браузере initData пустой) */
export const isTelegram = Boolean(tg && tg.initData !== '');

/**
 * Инициализация Mini App: сообщаем «готово», разворачиваем на весь экран
 * и прокидываем тему Telegram в CSS-переменные (--tg-*).
 */
export function initTelegram(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
  applyTheme();
  // Тема может меняться на лету (пользователь переключил светлую/тёмную).
  tg.onEvent('themeChanged', applyTheme);
}

function applyTheme(): void {
  if (!tg) return;
  const root = document.documentElement;
  root.dataset.tgScheme = tg.colorScheme;
  for (const [key, value] of Object.entries(tg.themeParams)) {
    // bg_color -> --tg-bg-color
    root.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, value);
  }
}
