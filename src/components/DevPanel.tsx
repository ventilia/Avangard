// Дев-инструменты: быстрая прокрутка состояния, тестирование таймера и берцов.

import { MAX_DAY } from '../game/types';
import { computeCountdown } from '../game/service';

export type Dev = {
  setDay: (d: number) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
  serviceBeforeCall: () => void;
  serviceCallNow: () => void;
  serviceDemobSoon: (sec?: number) => void;
  serviceReset: () => void;
  triggerBoots: () => void;
  toggleSound: () => void;
};

type Props = {
  day: number;
  onboarded: boolean;
  bootsDirty: boolean;
  serviceStart: number;
  serviceEnd: number;
  dev: Dev;
  onNewScene: () => void;
};

export function DevPanel({ day, onboarded, bootsDirty, serviceStart, serviceEnd, dev, onNewScene }: Props) {
  const { phase, days, hours, minutes, seconds } = computeCountdown(serviceStart, serviceEnd);

  const phaseLabel =
    phase === 'before' ? 'до призыва' :
    phase === 'serving' ? 'служит' :
    '🎖 дембель';

  const timeStr =
    phase === 'done'
      ? '—'
      : `${days}д ${hours}ч ${minutes}м ${seconds}с`;

  return (
    <div className="dev-block">
      <div className="dev-title">DEV · день {onboarded ? day : '—'}</div>
      <div className="dev-row">
        <button onClick={() => dev.setDay(Math.max(1, day - 1))}>−день</button>
        <button onClick={() => dev.setDay(Math.min(MAX_DAY, day + 1))}>+день</button>
        <button onClick={() => dev.setDay(MAX_DAY)}>день {MAX_DAY}</button>
      </div>
      <div className="dev-row">
        <button onClick={() => dev.setOnboarded(false)}>онбординг</button>
        <button onClick={dev.reset}>сброс</button>
        <button onClick={onNewScene}>фон</button>
      </div>

      <div className="dev-title">
        берцы {bootsDirty ? '🥾 (грязные)' : '✓'}
      </div>
      <div className="dev-row">
        <button onClick={dev.triggerBoots}>запросить берцы</button>
      </div>

      <div className="dev-title">
        таймер · <span className="dev-phase">{phaseLabel}</span>
      </div>
      <div className="dev-timer-info">{timeStr}</div>
      <div className="dev-row">
        <button onClick={dev.serviceBeforeCall}>до призыва</button>
        <button onClick={dev.serviceCallNow}>призыв</button>
      </div>
      <div className="dev-row">
        <button onClick={() => dev.serviceDemobSoon(10)}>дембель 10с</button>
        <button onClick={() => dev.serviceDemobSoon(60)}>дембель 1м</button>
      </div>
      <div className="dev-row">
        <button onClick={dev.serviceReset}>сброс срока</button>
      </div>

    </div>
  );
}
