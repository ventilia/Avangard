// Хук-оркестратор: связывает чистое ядро (reducer/селекторы) с React,
// управляет переходом «закрытие глаза» (blink) и показом диалогов.

import { useEffect, useReducer, useRef, useState } from 'react';
import {
  computeDay,
  isShaveable,
  loadState,
  reducer,
  saveState,
  spriteFor,
} from './gameState';
import { DIALOGUES, pickRandom, type Script } from './dialogues';

// Тайминги перехода-моргания (мс). Смена спрайта — в момент «закрытых глаз».
const BLINK_CLOSE = 260;
const BLINK_OPEN = 300;

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [blinking, setBlinking] = useState(false);
  const [dialog, setDialog] = useState<Script | null>(null);
  const timers = useRef<number[]>([]);

  // Персист при каждом изменении.
  useEffect(() => saveState(state), [state]);

  // Приветствие при первом запуске.
  useEffect(() => {
    if (!state.onboarded && state.shaveStage === 'none') setDialog(DIALOGUES.greet);
    // только при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Чистим таймеры при размонтировании.
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const day = computeDay(state);
  const shaveable = isShaveable(state, day);
  const sprite = spriteFor(state, day);

  // Запускает «моргание»: mid() вызывается, когда глаз закрыт (смена спрайта).
  function blink(mid: () => void) {
    if (blinking) return;
    setBlinking(true);
    timers.current.push(window.setTimeout(mid, BLINK_CLOSE));
    timers.current.push(window.setTimeout(() => setBlinking(false), BLINK_CLOSE + BLINK_OPEN));
  }

  // Действие бритья (вызывается по завершении удержания кнопки).
  // Предполагает, что бритьё доступно (foam → half → clean).
  function act() {
    if (blinking) return;
    setDialog(null); // убираем открытый диалог на время действия

    if (state.shaveStage === 'none') {
      blink(() => dispatch({ type: 'FOAM' }));
      return;
    }

    const fromHalf = state.shaveStage === 'half';
    const wasOnboarding = !state.onboarded;
    // Вариант half-спрайта выбираем здесь (вне редьюсера) — честный рандом.
    const halfVariant: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    blink(() => {
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

  return { state, day, shaveable, sprite, blinking, dialog, setDialog, act, tapLocked, dev };
}
