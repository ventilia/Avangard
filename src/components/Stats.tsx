function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="stat">
      <b>{n}</b>
      <span>{l}</span>
    </div>
  );
}

// Прогресс службы + ключевые цифры.
export function Stats({
  streak,
  best,
  total,
  served,
  progress,
}: {
  streak: number;
  best: number;
  total: number;
  served: number;
  progress: number;
}) {
  const pct = Math.round(progress * 100);
  return (
    <section className="stats">
      <div className="progress">
        <div className="progress__bar" style={{ width: `${pct}%` }} />
        <span className="progress__label">Отслужено {pct}%</span>
      </div>
      <div className="stats__grid">
        <Stat n={streak} l="стрик" />
        <Stat n={best} l="рекорд" />
        <Stat n={total} l="всего" />
        <Stat n={served} l="дней" />
      </div>
    </section>
  );
}
