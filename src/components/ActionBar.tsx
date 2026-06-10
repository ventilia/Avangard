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
  const fillRef = useRef<HTMLSpanElement | null>(null);
  // Флаг: пользователь удержал до конца, действие ждёт transitionend.
  const pendingAction = useRef(false);
  const holdTimer = useRef<number | null>(null);
  // Сохраняем свежую ссылку на onAction чтобы не пересоздавать listener.
  const onActionRef = useRef(onAction);
  useEffect(() => { onActionRef.current = onAction; });

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  // Listener на transitionend живёт всё время монтирования компонента.
  // Стреляет только когда pendingAction.current = true (удержание завершено).
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    function onEnd(e: TransitionEvent) {
      if (e.propertyName !== 'width') return;
      if (!pendingAction.current) return;

      // Транзиция width завершилась и это было нужное удержание.
      pendingAction.current = false;
      setHolding(false);
      onActionRef.current();
    }

    el.addEventListener('transitionend', onEnd);
    return () => el.removeEventListener('transitionend', onEnd);
    // Монтируется один раз; onActionRef - ref, не зависимость.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function down(e: PointerEvent) {
    e.preventDefault();
    if (busy) return;
    if (locked) {
      onLockedTap();
      return;
    }
    if (!holdMode) {
      onAction();
      return;
    }

    pendingAction.current = false;
    setHolding(true);

    // По истечении HOLD_MS помечаем что ждём transitionend.
    // CSS transition(width) на is-holding займёт ровно HOLD_MS и завершится
    // примерно в этот же момент — transitionend придёт чуть позже, это и есть
    // нужная нам точка.
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      pendingAction.current = true;
      // Не трогаем holding — is-holding остаётся, ширина 100%, transition идёт.
    }, HOLD_MS);
  }

  function up() {
    // Палец отпущен до конца — отменяем.
    clearTimer();
    pendingAction.current = false;
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
          {holdMode && !locked && (
              <span ref={fillRef} className="action-fill" aria-hidden />
          )}
          <span className="action-label">{label}</span>
          {holdMode && !locked && <span className="action-hint">удерживай</span>}
        </button>
      </div>
  );
}