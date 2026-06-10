// Боковое меню (дровер): дев-инструменты (в DEV) и подпись авторов.

import { DevPanel } from './DevPanel';

type Dev = {
  setDay: (d: number) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
};

type Props = {
  onClose: () => void;
  isDev: boolean;
  day: number;
  onboarded: boolean;
  dev: Dev;
  onNewScene: () => void;
};

export function Menu({ onClose, isDev, day, onboarded, dev, onNewScene }: Props) {
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
          {isDev ? (
            <DevPanel day={day} onboarded={onboarded} dev={dev} onNewScene={onNewScene} />
          ) : (
            <p className="menu-empty">пока пусто</p>
          )}
        </div>

        <div className="menu-footer">
          Олег Авангард <b>×</b> Venttt
        </div>
      </aside>
    </div>
  );
}
