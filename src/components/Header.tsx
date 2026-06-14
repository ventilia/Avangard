import { DAY_MS } from '../game/types';

type Props = {
  menuOpen: boolean;
  onMenu: () => void;
  streak: number;
  streakUpdatedAt: number | null;
  bootsDirty: boolean;
  onStreakTap: () => void;
};

function PixelFire({ warm, hot }: { warm: string; hot: string }) {
  return (
    <svg width="10" height="16" viewBox="0 0 5 8" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="0" width="1" height="1" fill={warm} />
      <rect x="1" y="1" width="1" height="1" fill={warm} />
      <rect x="3" y="1" width="1" height="1" fill={warm} />
      <rect x="1" y="2" width="3" height="1" fill={warm} />
      <rect x="0" y="3" width="5" height="2" fill={warm} />
      <rect x="1" y="5" width="3" height="1" fill={warm} />
      <rect x="2" y="6" width="1" height="2" fill={warm} />
      <rect x="2" y="2" width="1" height="3" fill={hot} />
    </svg>
  );
}

export function Header({ menuOpen, onMenu, streak, streakUpdatedAt, bootsDirty, onStreakTap }: Props) {
  const today = Math.floor(Date.now() / DAY_MS);
  const lastDay = streakUpdatedAt ? Math.floor(streakUpdatedAt / DAY_MS) : null;
  // Серый: берцы ждут чистки ИЛИ последнее обновление было вчера (risk зоны)
  const atRisk = bootsDirty || (lastDay !== null && today - lastDay === 1 && streak > 0);

  return (
    <header className="hud-top">
      <h1 className="brand">
        Рядовой <span className="brand-accent">Авангард</span>
      </h1>

      <div className="header-right">
        {streak > 0 && (
          <div
            className={`streak-badge${atRisk ? ' is-risk' : ''}`}
            title={`Серия: ${streak} дн.`}
            onClick={onStreakTap}
            style={{ cursor: 'pointer' }}
          >
            <PixelFire
              warm={atRisk ? '#555' : '#d4832e'}
              hot={atRisk ? '#888' : '#f5d84a'}
            />
            <span className="streak-count">{streak}</span>
          </div>
        )}
        <button className="burger" onClick={onMenu} aria-label="Меню" aria-expanded={menuOpen}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
