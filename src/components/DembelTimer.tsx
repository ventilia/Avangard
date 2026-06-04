import { useEffect, useState } from 'react';
import { SERVICE_MONTHS, SERVICE_START_ISO } from '../config';
import { addMonths } from '../game/dates';

const END = addMonths(new Date(SERVICE_START_ISO + 'T00:00:00'), SERVICE_MONTHS);
const pad = (n: number) => String(n).padStart(2, '0');

// Тикающий таймер до дембеля.
export function DembelTimer() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ms = Math.max(0, END.getTime() - now);
  if (ms === 0) {
    return (
      <div className="dembel">
        <div className="dembel__label">ДЕМБЕЛЬ! 🎖️</div>
      </div>
    );
  }

  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86_400);
  const h = Math.floor((sec % 86_400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return (
    <div className="dembel">
      <div className="dembel__label">до дембеля</div>
      <div className="dembel__time">
        <span className="u"><b>{days}</b><span>дней</span></span>
        <span className="u"><b>{pad(h)}</b><span>часов</span></span>
        <span className="u"><b>{pad(m)}</b><span>минут</span></span>
        <span className="u"><b>{pad(s)}</b><span>секунд</span></span>
      </div>
    </div>
  );
}
