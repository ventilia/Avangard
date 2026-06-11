// Боковое меню (дровер): таймер дембеля, дев-инструменты (в DEV), подпись.

import { useEffect, useState } from 'react';
import { DevPanel, type Dev } from './DevPanel';
import { computeCountdown } from '../game/service';

type Props = {
  onClose: () => void;
  isDev: boolean;
  day: number;
  onboarded: boolean;
  serviceStart: number;
  serviceEnd: number;
  dev: Dev;
  onNewScene: () => void;
};

// Живой обратный отсчёт до призыва/дембеля.
function ServiceTimer({ start, end }: { start: number; end: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const c = computeCountdown(start, end);

  return (
    <div className="service">
      <div className="service-label">{c.label}</div>
      {c.phase === 'done' ? (
        <div className="service-done">🎖 Свободен!</div>
      ) : (
        <div className="service-time">
          <span>
            <b>{c.days}</b> дн
          </span>
          <span>
            <b>{c.hours}</b> ч
          </span>
          <span>
            <b>{c.minutes}</b> м
          </span>
          <span>
            <b>{c.seconds}</b> с
          </span>
        </div>
      )}
    </div>
  );
}

export function Menu({
  onClose,
  isDev,
  day,
  onboarded,
  serviceStart,
  serviceEnd,
  dev,
  onNewScene,
}: Props) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <aside className="menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-head">
          <span>Меню</span>
          <button className="menu-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="menu-body">
          <ServiceTimer start={serviceStart} end={serviceEnd} />
          {isDev && <DevPanel day={day} onboarded={onboarded} dev={dev} onNewScene={onNewScene} />}
        </div>

        <div className="menu-footer">
          Олег Авангард <b>×</b> Venttt
        </div>
      </aside>
    </div>
  );
}
