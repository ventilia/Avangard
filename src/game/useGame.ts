import { useCallback, useMemo, useState } from 'react';
import { LINES, RITUALS, SERVICE_MONTHS, SERVICE_START_ISO, type Ritual } from '../config';
import { addMonths, daysBetween, isoWeekday, mondayOfWeekISO, shiftISO, toISODate } from './dates';
import { haptic } from '../telegram';

const STORAGE_KEY = 'avangard:v1';
const WEEK_SORTED = [...RITUALS].sort((a, b) => a.weekday - b.weekday);
const BY_WEEKDAY = new Map(RITUALS.map((r) => [r.weekday, r]));

interface SaveData {
  completed: string[]; // выполненные дни (YYYY-MM-DD)
  lastShaveISO: string | null; // когда последний раз брили
  firstOpenISO: string; // первый запуск (для стартовой щетины)
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.completed)) {
        return { completed: d.completed, lastShaveISO: d.lastShaveISO ?? null, firstOpenISO: d.firstOpenISO ?? toISODate() };
      }
    }
  } catch {
    // битый сейв — начнём заново
  }
  return { completed: [], lastShaveISO: null, firstOpenISO: toISODate() };
}

function persist(d: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // приватный режим / переполнение — молча игнорим
  }
}

/** Стрик = число подряд идущих дней, заканчивающихся сегодня или вчера. */
function computeStreak(set: Set<string>, todayISO: string): number {
  let cursor = todayISO;
  if (!set.has(cursor)) {
    cursor = shiftISO(todayISO, -1);
    if (!set.has(cursor)) return 0;
  }
  let n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = shiftISO(cursor, -1);
  }
  return n;
}

/** Самая длинная серия подряд за всё время. */
function bestRun(sorted: string[]): number {
  let best = 0;
  let run = 0;
  let prev = '';
  for (const iso of sorted) {
    run = prev && daysBetween(prev, iso) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = iso;
  }
  return best;
}

export function useGame() {
  const [data, setData] = useState<SaveData>(() => load());
  const [dayOffset, setDayOffset] = useState(0); // только для отладки вне Telegram
  const [flash, setFlash] = useState<Ritual['kind'] | null>(null);

  const today = shiftISO(toISODate(), dayOffset);
  const completedSet = useMemo(() => new Set(data.completed), [data.completed]);

  const todayWeekday = isoWeekday(new Date(today + 'T00:00:00'));
  const todayRitual = BY_WEEKDAY.get(todayWeekday)!;
  const todayDone = completedSet.has(today);

  const streak = useMemo(() => computeStreak(completedSet, today), [completedSet, today]);
  const bestStreak = useMemo(() => Math.max(streak, bestRun([...completedSet].sort())), [completedSet, streak]);
  const total = data.completed.length;

  // какие дни ТЕКУЩЕЙ недели уже выполнены
  const monday = mondayOfWeekISO(today);
  const doneThisWeek = useMemo(() => {
    const s = new Set<number>();
    for (let wd = 1; wd <= 7; wd++) {
      if (completedSet.has(shiftISO(monday, wd - 1))) s.add(wd);
    }
    return s;
  }, [completedSet, monday]);

  // щетина: дней с последнего бритья (или со старта + фора), нормируем на неделю
  const sinceShave = data.lastShaveISO ? daysBetween(data.lastShaveISO, today) : daysBetween(data.firstOpenISO, today) + 2;
  const stubble = Math.max(0, Math.min(1, sinceShave / 7));

  // дембель
  const endISO = toISODate(addMonths(new Date(SERVICE_START_ISO + 'T00:00:00'), SERVICE_MONTHS));
  const totalDays = Math.max(1, daysBetween(SERVICE_START_ISO, endISO));
  const served = Math.max(0, Math.min(totalDays, daysBetween(SERVICE_START_ISO, today)));
  const progress = served / totalDays;

  const olegLine = todayDone ? todayRitual.doneLine : stubble > 0.7 ? LINES.stubbly : LINES.needToday(todayRitual.short);

  const complete = useCallback(() => {
    if (completedSet.has(today)) return;
    setData((prev) => {
      const next: SaveData = {
        ...prev,
        completed: [...prev.completed, today].sort(),
        lastShaveISO: todayRitual.kind === 'shave' ? today : prev.lastShaveISO,
      };
      persist(next);
      return next;
    });
    setFlash(todayRitual.kind);
    haptic(todayRitual.kind === 'shave' ? 'success' : 'medium');
    window.setTimeout(() => setFlash(null), 700);
  }, [completedSet, today, todayRitual]);

  // dev-управление (перемотка дней / сброс) — дергаем только из dev-панели
  const travel = useCallback((delta: number) => setDayOffset((o) => o + delta), []);
  const reset = useCallback(() => {
    const fresh: SaveData = { completed: [], lastShaveISO: null, firstOpenISO: toISODate() };
    persist(fresh);
    setData(fresh);
    setDayOffset(0);
  }, []);

  return {
    todayRitual,
    todayDone,
    todayWeekday,
    week: WEEK_SORTED,
    doneThisWeek,
    streak,
    bestStreak,
    total,
    stubble,
    olegLine,
    flash,
    served,
    progress,
    complete,
    travel,
    reset,
    dayOffset,
  };
}
