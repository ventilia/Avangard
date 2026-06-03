import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite.
// host:true + allowedHosts нужны, чтобы открыть dev-сервер через туннель
// (cloudflared/ngrok) по https прямо в Telegram во время разработки.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Разрешаем домены быстрых туннелей. Только для разработки.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
  },
});
