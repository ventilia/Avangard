import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite.
// base нужен для GitHub Pages: продакшен-сайт живёт в подпапке /Avangard/
// (по имени репозитория). В dev оставляем корень — чтобы было удобно локально
// и работал туннель cloudflared.
// host:true + allowedHosts нужны, чтобы открыть dev-сервер через туннель
// (cloudflared/ngrok) по https прямо в Telegram во время разработки.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Avangard/' : '/',
  plugins: [react()],
  server: {
    host: true,
    // Разрешаем домены быстрых туннелей. Только для разработки.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
  },
}));
