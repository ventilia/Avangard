

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  colorScheme?: 'light' | 'dark';
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function initTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.('#0b0a09');
    tg.setBackgroundColor?.('#0b0a09');
  } catch {
    // Старые версии Telegram могут не знать часть методов — это не критично.
  }
}
