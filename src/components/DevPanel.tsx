// Дев-инструменты (живут внутри меню): быстрая прокрутка состояния для тестов.

import { MAX_DAY } from '../game/types';

export type Dev = {
  setDay: (d: number) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
  serviceBeforeCall: () => void;
  serviceCallNow: () => void;
  serviceDemobSoon: () => void;
  serviceReset: () => void;
};

type Props = {
  day: number;
  onboarded: boolean;
  dev: Dev;
  onNewScene: () => void;
};

export function DevPanel({ day, onboarded, dev, onNewScene }: Props) {
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

      <div className="dev-title">срок службы</div>
      <div className="dev-row">
        <button onClick={dev.serviceBeforeCall}>до призыва</button>
        <button onClick={dev.serviceCallNow}>призыв</button>
      </div>
      <div className="dev-row">
        <button onClick={dev.serviceDemobSoon}>дембель 1м</button>
        <button onClick={dev.serviceReset}>сброс срока</button>
      </div>
    </div>
  );
}
