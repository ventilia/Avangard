// Данные локаций (фоны) и выбор сцены.
// Спрайты героя вынесены в game/sprites.ts.

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