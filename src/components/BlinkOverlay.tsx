// Переход «моргание»: две створки смыкаются (closing), затем расходятся
// (opening). Спрайт меняется снаружи по событию закрытия — поэтому форму ведём
// именно событиями анимации, а не таймером.

import type { BlinkPhase } from '../game/useGame';

type Props = {
  phase: BlinkPhase;
  onClosed: () => void; // створки сомкнулись
  onOpened: () => void; // створки разошлись
};

export function BlinkOverlay({ phase, onClosed, onOpened }: Props) {
  // Слушаем конец анимации верхней створки (нижняя идёт синхронно).
  const handleEnd = () => {
    if (phase === 'closing') onClosed();
    else if (phase === 'opening') onOpened();
  };

  const cls =
    'blink' +
    (phase !== 'idle' ? ' is-on' : '') +
    (phase === 'closing' ? ' is-closing' : '') +
    (phase === 'opening' ? ' is-opening' : '');

  return (
    <div className={cls} aria-hidden>
      <span className="blink-top" onAnimationEnd={handleEnd} />
      <span className="blink-bottom" />
    </div>
  );
}
