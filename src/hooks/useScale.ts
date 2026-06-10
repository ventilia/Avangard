// Масштабирование сцены под РЕАЛЬНЫЙ размер видимого контейнера.
//
// Цель: по умолчанию ПОЛНОСТЬЮ заполнять пространство (без полей), даже ценой
// лёгкого непропорционального растяжения. Поля появляются только при сильном
// расхождении пропорций (очень широкие/узкие экраны) и заполняются размытой
// сценой.
//
// Размер берём ResizeObserver-ом с самого элемента-рамки, а НЕ из
// window/Telegram-вьюпорта: viewportStableHeight в TG меньше реального окна и
// давал поля. Размер DOM-элемента — источник правды.

import { useLayoutEffect, useState, type RefObject } from 'react';
import { onViewportChange } from '../telegram';

// scale + смещение центрирования (ненулевое только когда появляются поля).
export type Scale = { x: number; y: number; ox: number; oy: number };

// До скольки одна ось может быть крупнее другой, прежде чем включатся поля.
// 0.45 = до 45% непропорционального растяжения. Телефоны и окно TG (они выше
// по пропорции, чем 9:16) заполняются полностью; поля — только на экстремально
// широких/узких экранах. Больше — меньше полей, но сильнее искажение фигуры.
const MAX_STRETCH = 0.45;

export function useScale(ref: RefObject<HTMLElement | null>, baseW: number, baseH: number): Scale {
  const [scale, setScale] = useState<Scale>({ x: 1, y: 1, ox: 0, oy: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;

      let x = w / baseW;
      let y = h / baseH;

      // Ограничиваем перекос. По умолчанию (в пределах допуска) — точное
      // заполнение: x=w/baseW, y=h/baseH, поля нулевые.
      const max = 1 + MAX_STRETCH;
      if (x > y * max) x = y * max; // слишком широко → поля по бокам
      else if (y > x * max) y = x * max; // слишком высоко → поля сверху/снизу

      // Центрируем по «лишней» оси (если поля появились).
      const ox = (w - baseW * x) / 2;
      const oy = (h - baseH * y) / 2;

      setScale((p) =>
        p.x === x && p.y === y && p.ox === ox && p.oy === oy ? p : { x, y, ox, oy },
      );
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
