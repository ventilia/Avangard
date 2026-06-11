// Герой: пиксельная тень + стопка спрайтов. ВСЕ спрайты примонтированы слоями,
// активный — видимый (opacity). Смена спрайта = переключение видимости, без
// повторного декода → мгновенно (важно на телефоне). Маска/дыхание/тень — на
// обёртке-композите.

import { type CSSProperties } from 'react';
import type { OlegPlacement } from '../scenes';
import { PRELOAD_SPRITES } from '../game/sprites';

type Props = {
  src: string;
  placement: OlegPlacement;
  onTap?: () => void;
};

export function Oleg({ src, placement, onTap }: Props) {
  const style: CSSProperties = {
    '--ox': `${placement.xPct ?? -2}%`,
    '--oleg-h': `${placement.heightVh ?? 82}%`,
    '--oleg-bottom': `${-(placement.dropVh ?? 10)}%`,
  } as CSSProperties;

  return (
    <>
      <div className="oleg-shadow" aria-hidden />
      <div
        className={`oleg-wrap${onTap ? ' is-tappable' : ''}`}
        style={style}
        onClick={onTap}
      >
        <div className="oleg-stack">
          {PRELOAD_SPRITES.map((s) => {
            const active = s === src;
            return (
              <img
                key={s}
                className={`oleg-layer${active ? ' is-active' : ''}`}
                src={s}
                alt={active ? 'Олег' : ''}
                aria-hidden={!active}
                draggable={false}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
