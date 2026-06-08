// Данные сцен: список фонов и тонкая подгонка Олега под каждый из них.
// Всё держим здесь отдельно от разметки — чтобы крутить расположение Олега
// под перспективу конкретного фона, не лазая в компоненты.

import oleg from './asset/1.png';
export { oleg };

// Как поставить Олега в сцене. Любое поле опционально — чего нет, берётся
// из дефолтов в App/CSS. Это и есть ручки для «кучи правок».
export type OlegPlacement = {
  heightVh?: number; // высота фигуры, % высоты экрана (крупнее = ближе)
  xPct?: number; // сдвиг по горизонтали от центра, % (минус — влево)
  dropVh?: number; // опустить ниже низа экрана, % (сильнее срезать торс)
};

export type Scene = {
  id: string;
  label: string; // человеческая подпись (для отладки/будущего UI)
  src: string;
  oleg: OlegPlacement;
};

// Грузим все фоны разом. Добавить новый фон = просто положить файл в asset/phone.
const modules = import.meta.glob('./asset/phone/*.{jpg,jpeg,png}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// Подписи и индивидуальная подгонка Олега под перспективу каждой сцены.
// Ключ — имя файла без расширения. Заполняется по мере визуальной доводки.
const tuning: Record<string, { label: string; oleg?: OlegPlacement }> = {
  'photo_2026-06-08_23-28-30': { label: 'столовая' },
  'photo_2026-06-08_23-28-32': { label: 'каптёрка' },
  'photo_2026-06-08_23-28-32 (2)': { label: 'коридор' },
  'photo_2026-06-08_23-28-33': { label: 'склад' },
  'photo_2026-06-08_23-28-34': { label: 'склад (вечер)' },
  'photo_2026-06-08_23-28-34 (2)': { label: 'казарма' },
  'photo_2026-06-08_23-28-35': { label: 'раздевалка' },
  'photo_2026-06-08_23-28-42': { label: 'коридор с флагом' },
};

export const scenes: Scene[] = Object.entries(modules)
  .map(([path, src]) => {
    const base = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    const t = tuning[base] ?? {};
    return { id: base, label: t.label ?? base, src, oleg: t.oleg ?? {} };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const LAST_KEY = 'avangard:last-scene';

// Случайная сцена при каждом заходе, но без повтора предыдущей.
// last храним в localStorage — переживает перезагрузку страницы.
export function pickScene(): Scene {
  let pool = scenes;
  try {
    const last = localStorage.getItem(LAST_KEY);
    if (last && scenes.length > 1) {
      pool = scenes.filter((s) => s.id !== last);
    }
  } catch {
    // localStorage может быть недоступен — тогда просто берём из всех.
  }
  const scene = pool[Math.floor(Math.random() * pool.length)];
  try {
    localStorage.setItem(LAST_KEY, scene.id);
  } catch {
    /* не критично */
  }
  return scene;
}
