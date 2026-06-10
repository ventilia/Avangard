// Масштабирование сцены под РЕАЛЬНЫЙ размер видимого контейнера.
//
// Меряем сам элемент-рамку через ResizeObserver, а не window/Telegram-вьюпорт:
// в TG viewportStableHeight/innerHeight могут врать (меньше реального окна) —
// из-за этого появлялись поля. Размер DOM-элемента — источник правды.
//
// Контент тянется неравномерно (X и Y отдельно), чтобы заполнить экран; лёгкое
// искажение допустимо. При сильном расхождении пропорций растяжение
// ограничивается, и по «лишней» оси появляются (мягкие) поля.

import { useLayoutEffect, useState, type RefObject } from 'react';
import { onViewportChange } from '../telegram';

export type Scale = { x: number; y: number };

// До скольки одна ось может быть крупнее другой, прежде чем включатся поля.
// 0.22 = до 22% непропорционального растяжения (большинство телефонов
// дозаполняются полностью). Больше — меньше полей, но сильнее искажение.
const MAX_STRETCH = 0.22;

export function useScale(
  ref: RefObject<HTMLElement | null>,
  baseW: number,
  baseH: number,
): Scale {
  const [scale, setScale] = useState<Scale>({ x: 1, y: 1 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;

      let x = w / baseW;
      let y = h / baseH;

      const max = 1 + MAX_STRETCH;
      if (x > y * max) x = y * max; // слишком широко → поля по бокам
      else if (y > x * max) y = x * max; // слишком высоко → поля сверху/снизу

      setScale((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    const off = onViewportChange(calc); // TG может менять вьюпорт без ресайза элемента
    window.addEventListener('orientationchange', calc);

    return () => {
      ro.disconnect();
      off();
      window.removeEventListener('orientationchange', calc);
    };
  }, [ref, baseW, baseH]);

  return scale;
}
