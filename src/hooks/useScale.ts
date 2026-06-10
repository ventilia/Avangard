// Расчёт масштаба letterbox: вписываем опорный блок baseW×baseH в текущий
// вьюпорт, сохраняя пропорции. Источник размеров — Telegram (если есть) или окно.
//
// «Мягкий» режим: контент может немного растягиваться/сжиматься вместо
// немедленного появления полей. Поля появляются только при сильном расхождении
// соотношений сторон (> STRETCH_LIMIT). Это убирает полосы на большинстве телефонов.

import { useEffect, useState } from 'react';
import { getViewportSize, onViewportChange } from '../telegram';

// Насколько контент может отклониться от идеального масштаба (15%).
// Пример: экран 390×844 (iPhone 14) vs базовый 405×720 — разница ~4%, поля не нужны.
// Экран 1280×800 (десктоп широкий) — разница большая, поля уместны.
const STRETCH_LIMIT = 0.15;

export function useScale(baseW: number, baseH: number): number {
  const calc = (): number => {
    const { w, h } = getViewportSize();

    // Масштаб по каждой оси: насколько нужно увеличить/уменьшить базовый блок.
    const scaleX = w / baseW;
    const scaleY = h / baseH;

    // Строгий letterbox (вписать без обрезки): меньший из двух.
    const strict = Math.min(scaleX, scaleY);

    // «Мягкий»: берём геометрическое среднее — компромисс между осями.
    // Контент чуть выходит за пределы по одной оси, но поля минимальны.
    const soft = Math.sqrt(scaleX * scaleY);

    // Если мягкий масштаб не выходит за допуск от строгого — используем его.
    // Иначе ограничиваем: строгий + не более STRETCH_LIMIT относительно него.
    const maxSoft = strict * (1 + STRETCH_LIMIT);
    return Math.min(soft, maxSoft);
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