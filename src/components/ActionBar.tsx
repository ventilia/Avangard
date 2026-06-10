
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

const HOLD_MS = 680;

type Props = {
  label: string;
  locked: boolean;
  holdMode: boolean;
  busy: boolean;
  onAction: () => void;
  onLockedTap: () => void;
};

export function ActionBar({ label, locked, holdMode, busy, onAction, onLockedTap }: Props) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => clear, []);

  function down(e: PointerEvent) {
    e.preventDefault();
    if (busy) return;
    if (locked) {
      onLockedTap();
      return;
    }
    if (!holdMode) {
      onAction(); // пена — сразу по нажатию
      return;
    }
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      clear();
      onAction();
    }, HOLD_MS);
  }

  function up() {
    clear();
    setHolding(false);
  }

  const cls =
    'action-btn' +
    (locked ? ' is-locked' : '') +
    (holding ? ' is-holding' : '') +
    (!locked && !busy ? ' is-ready' : '');

  return (
    <div className="action-bar">
      <button
        className={cls}
        style={{ '--hold': `${HOLD_MS}ms` } as CSSProperties}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        disabled={busy}
      >
        {holdMode && !locked && <span className="action-fill" aria-hidden />}
        <span className="action-label">{label}</span>
        {holdMode && !locked && <span className="action-hint">удерживай</span>}
      </button>
    </div>
  );
}
