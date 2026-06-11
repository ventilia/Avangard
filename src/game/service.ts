// Срок службы и обратный отсчёт до дембеля.
// Считается от реального времени, поэтому корректен, даже если игрок зашёл позже.

// 17 июня 2026 → 17 июня 2027 (срочка 1 год). Месяц в Date.UTC — 0-индексный.
export const DEFAULT_SERVICE_START = Date.UTC(2026, 5, 17, 0, 0, 0);
export const DEFAULT_SERVICE_END = Date.UTC(2027, 5, 17, 0, 0, 0);

export type ServicePhase = 'before' | 'serving' | 'done';

export type Countdown = {
  phase: ServicePhase;
  label: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function breakdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function computeCountdown(start: number, end: number, now = Date.now()): Countdown {
  if (now < start) {
    return { phase: 'before', label: 'до призыва', ...breakdown(start - now) };
  }
  if (now >= end) {
    return { phase: 'done', label: 'Дембель!', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return { phase: 'serving', label: 'до дембеля', ...breakdown(end - now) };
}
