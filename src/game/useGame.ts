// Хук-оркестратор: связывает чистое ядро (reducer/селекторы) с React,
// управляет переходом «закрытие глаза» (blink) и показом диалогов.
//
// Переход управляется СОБЫТИЯМИ анимации, а не таймерами: спрайт меняется
// ровно когда веки сомкнулись (animationend фазы closing). На мобильных
// таймеры плывут — событийная модель надёжнее.

import { useEffect, useReducer, useRef, useState } from 'react';
import { computeDay, isShaveable, loadState, reducer, saveState, spriteFor } from './gameState';
import { DIALOGUES, pickRandom, type Script } from './dialogues';

export type BlinkPhase = 'idle' | 'closing' | 'opening';

// Страховка на случай, если animationend не придёт (reduced-motion / сбой).
const BLINK_SAFETY_MS = 700;

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [blinkPhase, setBlinkPhase] = useState<BlinkPhase>('idle');
  const [dialog, setDialog] = useState<Script | null>(null);
  // Действие, которое применяется в момент полного смыкания век.
  const pendingMid = useRef<(() => void) | null>(null);

  const blinking = blinkPhase !== 'idle';

  // Персист при каждом изменении.
  useEffect(() => saveState(state), [state]);

  // Приветствие при первом запуске.
  useEffect(() => {
    if (!state.onboarded && state.shaveStage === 'none') setDialog(DIALOGUES.greet);
    // только при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = computeDay(state);
  const shaveable = isShaveable(state, day);
  const sprite = spriteFor(state, day);

  // Веки сомкнулись → применяем изменение и начинаем раскрытие.
  function handleBlinkClosed() {
    if (blinkPhase !== 'closing') return;
    pendingMid.current?.();
    pendingMid.current = null;
    setBlinkPhase('opening');
  }

  // Веки раскрылись → переход завершён.
  function handleBlinkOpened() {
    if (blinkPhase !== 'opening') return;
    setBlinkPhase('idle');
  }

  // Страховочный таймер: если событие анимации не пришло — двигаем фазу сами.
  useEffect(() => {
    if (blinkPhase === 'idle') return;
    const t = window.setTimeout(() => {
      if (blinkPhase === 'closing') handleBlinkClosed();
      else handleBlinkOpened();
    }, BLINK_SAFETY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blinkPhase]);

  // Запускает переход: mid применится в момент закрытых век.
  function startBlink(mid: () => void) {
    if (blinking) return;
    pendingMid.current = mid;
    setBlinkPhase('closing');
  }

  // Действие бритья (по завершении удержания кнопки): foam → half → clean.
  function act() {
    if (blinking) return;
    setDialog(null); // убираем открытый диалог на время действия

    if (state.shaveStage === 'none') {
      startBlink(() => dispatch({ type: 'FOAM' }));
      return;
    }

    const fromHalf = state.shaveStage === 'half';
    const wasOnboarding = !state.onboarded;
    // Вариант half-спрайта выбираем здесь (вне редьюсера) — честный рандом.
    const halfVariant: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    startBlink(() => {
      dispatch({ type: 'SHAVE', halfVariant });
      if (fromHalf) {
        setDialog(wasOnboarding ? DIALOGUES.firstShaved : pickRandom(DIALOGUES.shaved));
      }
    });
  }

  // Тап по заблокированной кнопке (ещё рано бриться) — просто реплика.
  function tapLocked() {
    if (blinking) return;
    setDialog(pickRandom(DIALOGUES.tooEarly));
  }

  // Дев-режим.
  const dev = {
    setDay: (d: number) => dispatch({ type: 'DEV_SET_DAY', day: d }),
    setOnboarded: (v: boolean) => {
      dispatch({ type: 'DEV_SET_ONBOARDED', value: v });
      if (!v) setDialog(DIALOGUES.greet);
    },
    reset: () => {
      dispatch({ type: 'DEV_RESET' });
      setDialog(DIALOGUES.greet);
    },
  };

  return {
    state,
    day,
    shaveable,
    sprite,
    blinking,
    blinkPhase,
    handleBlinkClosed,
    handleBlinkOpened,
    dialog,
    setDialog,
    act,
    tapLocked,
    dev,
  };
}
