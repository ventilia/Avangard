import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Avangard/' : '/',
  plugins: [react()],
  server: {
    host: true,
    // Разрешаем домены быстрых туннелей. Только для разработки.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
  },
}));
