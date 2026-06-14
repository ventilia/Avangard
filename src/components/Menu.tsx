// Боковое меню (дровер): таймер дембеля, звук, дев-инструменты, каналы.

import { useEffect, useState } from 'react';
import { DevPanel, type Dev } from './DevPanel';
import { computeCountdown } from '../game/service';
import logo1 from '../asset/logo1.png';
import logo2 from '../asset/logo2.png';

type Props = {
  onClose: () => void;
  isDev: boolean;
  day: number;
  onboarded: boolean;
  soundEnabled: boolean;
  bootsDirty: boolean;
  serviceStart: number;
  serviceEnd: number;
  dev: Dev;
  onNewScene: () => void;
  onToggleSound: () => void;
};

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
          <span><b>{c.days}</b> дн</span>
          <span><b>{c.hours}</b> ч</span>
          <span><b>{c.minutes}</b> м</span>
          <span><b>{c.seconds}</b> с</span>
        </div>
      )}
    </div>
  );
}

function openTG(url: string) {
  const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void } } }).Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

export function Menu({
  onClose,
  isDev,
  day,
  onboarded,
  soundEnabled,
  bootsDirty,
  serviceStart,
  serviceEnd,
  dev,
  onNewScene,
  onToggleSound,
}: Props) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <aside className="menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-head">
          <span>Меню</span>
          <button className="menu-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className="menu-body">
          <ServiceTimer start={serviceStart} end={serviceEnd} />

          <button
            className="sound-toggle"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            <span className="sound-icon">{soundEnabled ? '🔊' : '🔇'}</span>
            <span className="sound-label">{soundEnabled ? 'Звук вкл' : 'Звук выкл'}</span>
          </button>

          {isDev && (
            <DevPanel
              day={day}
              onboarded={onboarded}
              bootsDirty={bootsDirty}
              serviceStart={serviceStart}
              serviceEnd={serviceEnd}
              dev={dev}
              onNewScene={onNewScene}
            />
          )}
        </div>

        <div className="menu-footer">
          <div className="menu-channels">
            <button
              className="menu-channel-btn"
              onClick={() => openTG('https://t.me/oleg_avangard')}
              aria-label="Канал Олега"
            >
              <img src={logo1} className="menu-channel-img" draggable={false} alt="" />
              <span className="menu-channel-name">oleg_avangard</span>
            </button>
            <button
              className="menu-channel-btn"
              onClick={() => openTG('https://t.me/VENTTTP')}
              aria-label="Канал Venttt"
            >
              <img src={logo2} className="menu-channel-img" draggable={false} alt="" />
              <span className="menu-channel-name">VENTTTP</span>
            </button>
          </div>
          <div className="menu-credits">Олег Авангард <b>×</b> Venttt</div>
        </div>
      </aside>
    </div>
  );
}
