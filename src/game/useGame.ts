// Хук-оркестратор: связывает чистое ядро (reducer/селекторы) с React,
// управляет переходом «закрытие глаза» (blink), диалогами и мини-игрой берцов.

import { useEffect, useReducer, useRef, useState } from 'react';
import { computeDay, isShaveable, loadState, reducer, saveState, spriteFor } from './gameState';
import { DIALOGUES, pickRandom, type Script } from './dialogues';
import { BOOTS_EVERY, DAY_MS, MAX_DAY } from './types';
import { DEFAULT_SERVICE_END, DEFAULT_SERVICE_START, computeCountdown } from './service';
import { getUserName } from '../telegram';
import { isSyncEnabled, syncProgress } from '../api';
import { SFX } from './sound';

export type BlinkPhase = 'idle' | 'closing' | 'opening';

const BLINK_SAFETY_MS = 700;

function applyName(script: Script, name: string): Script {
  return { ...script, pages: script.pages.map((p) => p.split('{name}').join(name)) };
}

function applyStreak(script: Script, streak: number): Script {
  return { ...script, pages: script.pages.map((p) => p.split('{streak}').join(String(streak))) };
}

function named(script: Script): Script {
  return applyName(script, getUserName());
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [blinkPhase, setBlinkPhase] = useState<BlinkPhase>('idle');
  const [dialog, setDialog] = useState<Script | null>(null);
  const [bootsMode, setBootsMode] = useState(false);
  const [bootsKey, setBootsKey] = useState(0);

  // Действие в момент полного смыкания век.
  const pendingMid = useRef<(() => void) | null>(null);
  // После shaved-диалога нужно показать boots-диалог.
  const pendingBootsDialog = useRef(false);

  const blinking = blinkPhase !== 'idle';
  const soundOn = state.soundEnabled;

  const day = computeDay(state);
  const shaveable = isShaveable(state, day);
  const sprite = spriteFor(state, day);

  // Персист при каждом изменении.
  useEffect(() => saveState(state), [state]);

  // Загрузка серверного прогресса при старте.
  useEffect(() => {
    if (!isSyncEnabled()) return;
    let cancelled = false;
    syncProgress().then((server) => {
      if (!cancelled && server) {
        dispatch({ type: 'HYDRATE', onboarded: server.onboarded, lastShaveAt: server.lastShaveAt, streak: server.streak });
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сохранение прогресса на сервер.
  useEffect(() => {
    if (!isSyncEnabled()) return;
    void syncProgress({ onboarded: state.onboarded, lastShaveAt: state.lastShaveAt, streak: state.streak });
  }, [state.onboarded, state.lastShaveAt, state.streak]);

  // Инициализация: приветствие ИЛИ показ ожидающего boots-диалога.
  useEffect(() => {
    // Если берцы уже просрочены при старте — сразу сбрасываем, диалог не показываем.
    if (state.bootsDirty && state.bootsDirtySinceDay != null && day > state.bootsDirtySinceDay) {
      dispatch({ type: 'BOOTS_EXPIRED' });
      if (!state.onboarded && state.shaveStage === 'none') setDialog(named(DIALOGUES.greet));
      return;
    }
    if (state.bootsDirty && state.bootsDialogDue) {
      dispatch({ type: 'BOOTS_DIALOG_SHOWN' });
      setDialog(named(pickRandom(DIALOGUES.bootsRequest)));
    } else if (!state.onboarded && state.shaveStage === 'none') {
      setDialog(named(DIALOGUES.greet));
    }
    // только при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Истечение запроса берцов: сравниваем computeDay с днём тригера.
  // Работает и в реальном времени (через setTimeout до полуночи),
  // и в дев-режиме (useEffect триггерится при изменении day).
  useEffect(() => {
    if (!state.bootsDirty || state.bootsDirtySinceDay == null) return;
    if (day > state.bootsDirtySinceDay) {
      dispatch({ type: 'BOOTS_EXPIRED' });
      return;
    }
    // Просыпаемся ровно в полночь реального времени, чтобы поймать истечение.
    const now = Date.now();
    const msUntilMidnight = DAY_MS - (now % DAY_MS) + 100; // +100ms запас
    const id = window.setTimeout(() => {
      dispatch({ type: 'BOOTS_EXPIRED' });
    }, msUntilMidnight);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, state.bootsDirty, state.bootsDirtySinceDay]);

  // Обнаружение дембеля (работает и пока приложение открыто — для дев-теста).
  const demobSeenRef = useRef(state.demobSeen);
  demobSeenRef.current = state.demobSeen;
  const serviceStart = state.devServiceStart ?? DEFAULT_SERVICE_START;
  const serviceEnd = state.devServiceEnd ?? DEFAULT_SERVICE_END;

  useEffect(() => {
    if (!state.onboarded) return;
    const id = window.setInterval(() => {
      if (demobSeenRef.current) { clearInterval(id); return; }
      const { phase } = computeCountdown(serviceStart, serviceEnd);
      if (phase === 'done') {
        dispatch({ type: 'DEMOB_SEEN' });
        SFX.demob(soundOn);
        setDialog(named(pickRandom(DIALOGUES.demob)));
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceStart, serviceEnd, state.onboarded]);

  // ── Blink ────────────────────────────────────────────────────────────────

  function handleBlinkClosed() {
    if (blinkPhase !== 'closing') return;
    pendingMid.current?.();
    pendingMid.current = null;
    setBlinkPhase('opening');
  }

  function handleBlinkOpened() {
    if (blinkPhase !== 'opening') return;
    setBlinkPhase('idle');
  }

  useEffect(() => {
    if (blinkPhase === 'idle') return;
    const t = window.setTimeout(() => {
      if (blinkPhase === 'closing') handleBlinkClosed();
      else handleBlinkOpened();
    }, BLINK_SAFETY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blinkPhase]);

  function startBlink(mid: () => void) {
    if (blinking) return;
    pendingMid.current = mid;
    setBlinkPhase('closing');
  }

  // ── Диалоги ──────────────────────────────────────────────────────────────

  // Закрытие диалога: если после shaved ожидает boots — показываем boots.
  function closeDialog() {
    if (pendingBootsDialog.current) {
      pendingBootsDialog.current = false;
      dispatch({ type: 'BOOTS_DIALOG_SHOWN' });
      SFX.bootsAlert(soundOn);
      setDialog(named(pickRandom(DIALOGUES.bootsRequest)));
    } else {
      SFX.dialogClose(soundOn);
      setDialog(null);
    }
  }

  // ── Действия ─────────────────────────────────────────────────────────────

  function act() {
    if (blinking) return;
    setDialog(null);

    if (state.shaveStage === 'none') {
      SFX.foam(soundOn);
      startBlink(() => dispatch({ type: 'FOAM' }));
      return;
    }

    const fromHalf = state.shaveStage === 'half';
    const wasOnboarding = !state.onboarded;
    const halfVariant: 0 | 1 = Math.random() < 0.5 ? 0 : 1;

    SFX.shave(soundOn);
    startBlink(() => {
      dispatch({ type: 'SHAVE', halfVariant });
      if (fromHalf) {
        const newCount = state.shaveCount + 1;
        const willTriggerBoots = newCount % 3 === 0 && !wasOnboarding;
        if (willTriggerBoots) pendingBootsDialog.current = true;
        SFX.dialogIn(soundOn);
        setDialog(named(wasOnboarding ? DIALOGUES.firstShaved : pickRandom(DIALOGUES.shaved)));
      }
    });
  }

  function tapLocked() {
    if (blinking) return;
    SFX.locked(soundOn);
    setDialog(named(pickRandom(DIALOGUES.tooEarly)));
  }

  function tapOleg() {
    if (blinking || dialog) return;
    SFX.tap(soundOn);
    // После дембеля — всегда речь благодарности.
    const { phase } = computeCountdown(serviceStart, serviceEnd);
    if (phase === 'done' && state.onboarded) {
      setDialog(named(pickRandom(DIALOGUES.demob)));
      return;
    }
    setDialog(named(pickRandom(DIALOGUES.taps)));
  }

  // ── Берцы ────────────────────────────────────────────────────────────────

  function startBootCleaning() {
    if (blinking) return;
    setBootsKey((k) => k + 1);
    startBlink(() => setBootsMode(true));
  }

  function finishBootCleaning() {
    if (blinking) return;
    SFX.dialogIn(soundOn);
    startBlink(() => {
      dispatch({ type: 'CLEAN_BOOTS' });
      setBootsMode(false);
      setDialog(named(pickRandom(DIALOGUES.bootsThanks)));
    });
  }

  function tapStreak() {
    if (blinking || dialog) return;
    SFX.tap(soundOn);
    const script = pickRandom(DIALOGUES.streakTap);
    setDialog(named(applyStreak(script, state.streak)));
  }

  // ── Дев ──────────────────────────────────────────────────────────────────

  const dev = {
    setDay: (d: number) => {
      const target = Math.max(1, Math.min(MAX_DAY, d));
      const currentDay = computeDay(state);
      const delta = Math.max(0, target - currentDay);
      const willTriggerBoots = delta > 0 && state.onboarded
        && Math.floor((state.shaveCount + delta) / BOOTS_EVERY) > Math.floor(state.shaveCount / BOOTS_EVERY);
      dispatch({ type: 'DEV_SET_DAY', day: target });
      if (willTriggerBoots) {
        setTimeout(() => {
          dispatch({ type: 'BOOTS_DIALOG_SHOWN' });
          SFX.bootsAlert(soundOn);
          setDialog(named(pickRandom(DIALOGUES.bootsRequest)));
        }, 300);
      }
    },
    setOnboarded: (v: boolean) => {
      dispatch({ type: 'DEV_SET_ONBOARDED', value: v });
      if (!v) setDialog(named(DIALOGUES.greet));
    },
    reset: () => {
      dispatch({ type: 'DEV_RESET' });
      setBootsMode(false);
      setDialog(named(DIALOGUES.greet));
    },
    serviceBeforeCall: () =>
      dispatch({ type: 'DEV_SET_SERVICE', start: Date.now() + 7 * DAY_MS, end: Date.now() + 372 * DAY_MS }),
    serviceCallNow: () =>
      dispatch({ type: 'DEV_SET_SERVICE', start: Date.now() - 1000, end: DEFAULT_SERVICE_END }),
    serviceDemobSoon: (sec = 10) =>
      dispatch({ type: 'DEV_SET_SERVICE', start: Date.now() - DAY_MS, end: Date.now() + sec * 1000 }),
    serviceReset: () => dispatch({ type: 'DEV_SET_SERVICE', start: null, end: null }),
    triggerBoots: () => {
      dispatch({ type: 'DEV_TRIGGER_BOOTS' });
      SFX.bootsAlert(soundOn);
      setDialog(named(pickRandom(DIALOGUES.bootsRequest)));
    },