// Масштабирование сцены под вьюпорт.
// Контент тянется неравномерно (X и Y отдельно), чтобы заполнить экран. Лёгкое
// искажение допустимо. Если соотношения сторон расходятся слишком сильно —
// растяжение ограничивается, и по «лишней» оси появляются (мягкие) поля.

import { useEffect, useState } from 'react';
import { getViewportSize, onViewportChange } from '../telegram';

export type Scale = { x: number; y: number };

// До скольки одна ось может быть крупнее другой, прежде чем включатся поля.
// 0.18 = до 18% непропорционального растяжения. Больше — меньше полей,
// но сильнее искажение фигуры.
const MAX_STRETCH = 0.18;

export function useScale(baseW: number, baseH: number): Scale {
  const calc = (): Scale => {
    const { w, h } = getViewportSize();
    let x = w / baseW;
    let y = h / baseH;

    // Ограничиваем перекос: ни одна ось не крупнее другой более чем в (1+T) раз.
    const max = 1 + MAX_STRETCH;
    if (x > y * max) x = y * max; // слишком широко → поля по бокам
    else if (y > x * max) y = x * max; // слишком высоко → поля сверху/снизу

    return { x, y };
  };

  const [scale, setScale] = useState<Scale>(calc);

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
