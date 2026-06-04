// Утилиты дат. Работаем по ЛОКАЛЬНОЙ дате пользователя (день = календарный день).

/** YYYY-MM-DD по локальному времени. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO-номер дня недели: 1=Пн … 7=Вс. */
export function isoWeekday(d: Date = new Date()): number {
  const js = d.getDay(); // 0=Вс..6=Сб
  return js === 0 ? 7 : js;
}

/** Сдвинуть дату-строку на delta дней. */
export function shiftISO(iso: string, deltaDays: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return toISODate(d);
}

/** Разница в полных днях (b - a) между двумя YYYY-MM-DD. */
export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00').getTime();
  const b = new Date(bISO + 'T00:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
}

/** ISO-дата понедельника той недели, в которую попадает iso. */
export function mondayOfWeekISO(iso: string): string {
  const wd = isoWeekday(new Date(iso + 'T00:00:00'));
  return shiftISO(iso, -(wd - 1));
}

/** Прибавить месяцы к дате (возвращает новый Date). */
export function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}
