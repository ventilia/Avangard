// Данные сцен и спрайты героя.
// Спрайты 1–7: asset/1.png–7.png. По дефолту активен 7-й (индекс 6).
// Логика выбора спрайта подключается снаружи через spriteIndex в App.

// ── Спрайты героя ────────────────────────────────────────────────────────────

import sprite1 from './asset/1.png';
import sprite2 from './asset/2.png';
import sprite3 from './asset/3.png';
import sprite4 from './asset/4.png';
import sprite5 from './asset/5.png';
import sprite6 from './asset/6.png';
import sprite7 from './asset/7.png';

// SPRITES[0] = 1.png  …  SPRITES[6] = 7.png
export const SPRITES = [
  sprite1,
  sprite2,
  sprite3,
  sprite4,
  sprite5,
  sprite6,
  sprite7,
] as const;

// 7-й спрайт по дефолту
export const DEFAULT_SPRITE_INDEX = 6;

// ── Типы ─────────────────────────────────────────────────────────────────────

// Тонкая подгонка позиции героя под перспективу конкретного фона.
// Все поля опциональны — отсутствующее берётся из дефолтов в App/CSS.
export type OlegPlacement = {
  heightVh?: number; // высота фигуры, % высоты экрана (крупнее = ближе к камере)
  xPct?: number;     // сдвиг от центра по горизонтали, % (минус — влево)
  dropVh?: number;   // сколько vh опустить ниже низа экрана (срезает торс)
};

export type Scene = {
  id: string;
  label: string;
  src: string;
  oleg: OlegPlacement;
};

// ── Фоны ─────────────────────────────────────────────────────────────────────

// Грузим все фоны из asset/background/ разом через glob.
// Добавить новую локацию = положить файл в папку, перезапустить dev-сервер.
const modules = import.meta.glob('./asset/background/*.{jpg,jpeg,png}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// Подписи и индивидуальная подгонка под перспективу каждого фона.
// Ключ — имя файла без расширения.
const tuning: Record<string, { label: string; oleg?: OlegPlacement }> = {
  'photo_2026-06-08_23-28-30':     { label: 'столовая' },
  'photo_2026-06-08_23-28-32':     { label: 'каптёрка' },
  'photo_2026-06-08_23-28-32 (2)': { label: 'коридор' },
  'photo_2026-06-08_23-28-33':     { label: 'склад' },
  'photo_2026-06-08_23-28-34':     { label: 'склад (вечер)' },
  'photo_2026-06-08_23-28-34 (2)': { label: 'казарма' },
  'photo_2026-06-08_23-28-35':     { label: 'раздевалка' },
  'photo_2026-06-08_23-28-42':     { label: 'коридор с флагом' },
};

export const scenes: Scene[] = Object.entries(modules)
    .map(([path, src]) => {
      const base = path.split('/').pop()!.replace(/\.[^.]+$/, '');
      const t = tuning[base] ?? {};
      return { id: base, label: t.label ?? base, src, oleg: t.oleg ?? {} };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

// ── Выбор сцены ───────────────────────────────────────────────────────────────

const LAST_KEY = 'avangard:last-scene';

// Случайная сцена при каждом заходе, но без повтора предыдущей.
// Последняя сцена сохраняется в localStorage — переживает перезагрузку.
export function pickScene(): Scene {
  let pool = scenes;
  try {
    const last = localStorage.getItem(LAST_KEY);
    if (last && scenes.length > 1) {
      pool = scenes.filter((s) => s.id !== last);
    }
  } catch {
    // localStorage недоступен — берём из всего пула
  }
  const scene = pool[Math.floor(Math.random() * pool.length)];
  try {
    localStorage.setItem(LAST_KEY, scene.id);
  } catch { /* не критично */ }
  return scene;
}