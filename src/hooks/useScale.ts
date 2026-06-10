// Расчёт масштаба letterbox: вписываем опорный блок baseW×baseH в текущий
// вьюпорт, сохраняя пропорции. Источник размеров — Telegram (если есть) или окно.

import { useEffect, useState } from 'react';
import { getViewportSize, onViewportChange } from '../telegram';

export function useScale(baseW: number, baseH: number): number {
  const calc = () => {
    const { w, h } = getViewportSize();
    return Math.min(w / baseW, h / baseH);
  };

  const [scale, setScale] = useState(calc);

  useEffect(() => {
    const update = () => setScale(calc());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const off = onViewportChange(update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseW, baseH]);

  return scale;
}
