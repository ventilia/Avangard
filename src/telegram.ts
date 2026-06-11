// Интеграция с Telegram Mini App. Вне Telegram все вызовы безопасно no-op.

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  colorScheme?: 'light' | 'dark';
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  initDataUnsafe?: { user?: { first_name?: string; username?: string } };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

function tg(): TgWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function initTelegram(): void {
  const app = tg();
  if (!app) return;
  try {
    app.ready();
    app.expand();
    app.disableVerticalSwipes?.();
    app.setHeaderColor?.('#0b0a09');
    app.setBackgroundColor?.('#000000');
  } catch {
    // Старые версии Telegram могут не знать часть методов — не критично.
  }
}

export function getViewportSize(): { w: number; h: number } {
  const app = tg();
  return {
    w: window.innerWidth,
    h: app?.viewportStableHeight || app?.viewportHeight || window.innerHeight,
  };
}

// Подписка на изменение вьюпорта (разворот, клавиатура и т.п.).
export function onViewportChange(cb: () => void): () => void {
  const app = tg();
  app?.onEvent?.('viewportChanged', cb);
  return () => app?.offEvent?.('viewportChanged', cb);
}

// Имя игрока из Telegram. Вне Telegram (или если имени нет) — «боец».
export function getUserName(): string {
  const name = tg()?.initDataUnsafe?.user?.first_name?.trim();
  return name || 'боец';
}
