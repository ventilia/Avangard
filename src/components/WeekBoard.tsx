import type { Ritual } from '../config';

const WD = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Доска недели: 7 дней, подсветка сегодняшнего, отметка выполненных.
export function WeekBoard({
  rituals,
  todayWeekday,
  doneWeekdays,
}: {
  rituals: Ritual[];
  todayWeekday: number;
  doneWeekdays: Set<number>;
}) {
  return (
    <div className="week">
      {rituals.map((r) => {
        const done = doneWeekdays.has(r.weekday);
        const today = r.weekday === todayWeekday;
        return (
          <div key={r.weekday} className={`day${today ? ' is-today' : ''}${done ? ' is-done' : ''}`}>
            <div className="day__wd">{WD[r.weekday]}</div>
            <div className="day__icon">{done ? '✓' : r.kind === 'shave' ? '★' : '•'}</div>
            <div className="day__name">{r.short}</div>
          </div>
        );
      })}
    </div>
  );
}
