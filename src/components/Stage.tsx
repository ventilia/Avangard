// Контейнер сцены: опорный блок BASE_W×BASE_H заполняет реальный размер рамки
// неравномерным transform: scale(). Поля (при сильном расхождении пропорций)
// заполняются размытой сценой.

import { useRef, type ReactNode } from 'react';
import { useScale } from '../hooks/useScale';
import { BASE_H, BASE_W } from '../game/types';

type Props = {
  bg: string; // src сцены для размытой подложки
  children: ReactNode;
};

export function Stage({ bg, children }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const scale = useScale(frameRef, BASE_W, BASE_H);

  return (
    <div className="frame" ref={frameRef}>
      <div className="frame-bg" style={{ backgroundImage: `url("${bg}")` }} aria-hidden />
      <div
        className="stage"
        style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale.x}, ${scale.y})` }}
      >
        {children}
      </div>
    </div>
  );
}
