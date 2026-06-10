import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

const HOLD_MS = 680;
// Один кадр (~16ms) после завершения CSS-анимации — гарантия что браузер
// успел отрисовать полное заполнение до того как action меняет состояние.
const AFTER_HOLD_MS = HOLD_MS + 16;

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
  const timerRef = useRef<number | null>(null);

  // Актуальные колбэки в ref — не пересоздаём таймер при каждом рендере.
  const onActionRef = useRef(onAction);
  const onLockedTapRef = useRef(onLockedTap);
  useEffect(() => { onActionRef.current = onAction; });
  useEffect(() => { onLockedTapRef.current = onLockedTap; });

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Чистим при размонтировании.
  useEffect(() => () => clearTimer(), []);

  // Сбрасываем holding если компонент перешёл в busy/locked/!holdMode.
  useEffect(() => {
    if (busy || locked || !holdMode) {
      clearTimer();
      setHolding(false);
    }
  }, [busy, locked, holdMode]);

  function down(e: PointerEvent) {
    e.preventDefault();
    if (busy) return;

    if (locked) {
      onLockedTapRef.current();
      return;
    }

    if (!holdMode) {
      // Пена — немедленное действие по касанию, без hold.
      onActionRef.current();
      return;
    }

    clearTimer();
    setHolding(true);

    // Таймер срабатывает через HOLD_MS + один кадр.
    // К этому моменту CSS width:100% transition(HOLD_MS) точно завершена
    // и браузер её отрисовал — пользователь видит полное заполнение.
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setHolding(false);
      onActionRef.current();
    }, AFTER_HOLD_MS);
  }

  function up() {
    // Палец отпущен — отмена.
    clearTimer();
    setHolding(false);
  }

  const cls = [
    'action-btn',
    locked && 'is-locked',
    holding && 'is-holding',
    !locked && !busy && 'is-ready',
  ].filter(Boolean).join(' ');

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