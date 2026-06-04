import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTelegram } from './telegram';
import { App } from './App';
import './index.css';
import './app.css';

// Инициализируем Telegram до рендера, чтобы шапка/разворот применились сразу.
initTelegram();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
