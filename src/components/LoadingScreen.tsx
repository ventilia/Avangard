// Стилизованный экран загрузки. Показывается, пока предзагружаются спрайты и
// фон — чтобы в игре смена спрайта была мгновенной.

type Props = { progress: number }; // 0..1

export function LoadingScreen({ progress }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <div className="loader">
      <div className="loader-grain" aria-hidden />
      <div className="loader-box">
        <h1 className="loader-title">
          Рядовой <span className="brand-accent">Авангард</span>
        </h1>
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="loader-hint">подготовка к службе… {pct}%</div>
      </div>
    </div>
  );
}
