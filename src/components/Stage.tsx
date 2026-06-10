// Letterbox-контейнер: фиксированный блок 9:16 масштабируется под вьюпорт
// единым transform: scale(). Поля заполняются размытой сценой — на телефоне
// их почти не видно, на десктопе получается кинематографичная рамка.

import { type ReactNode } from 'react';
import { useScale } from '../hooks/useScale';
import { BASE_H, BASE_W } from '../game/types';

type Props = {
  bg: string; // src сцены для размытой подложки
  children: ReactNode;
};

export function Stage({ bg, children }: Props) {
  const scale = useScale(BASE_W, BASE_H);

  return (
    <div className="frame">
      <div className="frame-bg" style={{ backgroundImage: `url("${bg}")` }} aria-hidden />
      <div
        className="stage"
        style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
