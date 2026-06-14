// Чистое ядро игры: начальное состояние, редьюсер, персист и селекторы.
// Никакого React — это легко тестировать и переиспользовать.

import { BOOTS_EVERY, DAY_MS, MAX_DAY, type GameAction, type GameState } from './types';
import { daySprite, FOAM, HALVES, UNSHAVEN } from './sprites';

const STORAGE_KEY = 'avangard:game:v1';

export const initialState: GameState = {
  onboarded: false,
  lastShaveAt: null,
  shaveStage: 'none',
  halfVariant: 0,
  devDay: null,
  devServiceStart: null,
  devServiceEnd: null,
  shaveCount: 0,
  bootsDirty: false,
  bootsDialogDue: false,
  bootsDirtySinceDay: null,
  soundEnabled: true,
  demobSeen: false,
  streak: 0,
  streakUpdatedAt: null,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...(JSON.parse(raw) as Partial<GameState>) };
  } catch {
    /* ignore */
  }
  return initialState;
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* не критично */
  }
}

// ── Стрик-хелпер ──────────────────────────────────────────────────────────────

function dayIdx(ts: number) { return Math.floor(ts / DAY_MS); }

function computeStreak(state: GameState): { streak: number; streakUpdatedAt: number } {
  const now = Date.now();
  const today = dayIdx(now);
  const last = state.streakUpdatedAt != null ? dayIdx(state.streakUpdatedAt) : null;
  if (last === null || today - last >= 2) return { streak: 1, streakUpdatedAt: now };
  if (today === last) return { streak: state.streak, streakUpdatedAt: state.streakUpdatedAt! };
  return { streak: state.streak + 1, streakUpdatedAt: now };
}

// ── Редьюсер ─────────────────────────────────────────────────────────────────

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'FOAM':
      if (state.shaveStage !== 'none') return state;
      return { ...state, shaveStage: 'foam' };

    case 'SHAVE':
      if (state.shaveStage === 'foam') {
        const variant = action.halfVariant ?? (Math.random() < 0.5 ? 0 : 1);
        return { ...state, shaveStage: 'half', halfVariant: variant };
      }
      if (state.shaveStage === 'half') {
        const newCount = state.shaveCount + 1;
        const triggerBoots = newCount % BOOTS_EVERY === 0;
        const { streak, streakUpdatedAt } = computeStreak(state);
        return {
          ...state,
          shaveStage: 'none',
          onboarded: true,
          lastShaveAt: Date.now(),
          devDay: null,
          shaveCount: newCount,
          bootsDirty: triggerBoots ? true : state.bootsDirty,
          bootsDialogDue: triggerBoots ? true : state.bootsDialogDue,
          // После бритья день сбрасывается в 1 — берцы выданы в день 1.
          bootsDirtySinceDay: triggerBoots ? 1 : state.bootsDirtySinceDay,
          streak,
          streakUpdatedAt,
        };
      }
      return state;

    case 'BOOTS_DIALOG_SHOWN':
      return { ...state, bootsDialogDue: false };

    case 'CLEAN_BOOTS': {
      const { streak, streakUpdatedAt } = computeStreak(state);
      return { ...state, bootsDirty: false, bootsDialogDue: false, bootsDirtySinceDay: null, streak, streakUpdatedAt };
    }

    case 'BOOTS_EXPIRED':
      return { ...state, bootsDirty: false, bootsDialogDue: false, bootsDirtySinceDay: null, streak: 0, streakUpdatedAt: null };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'DEMOB_SEEN':
      return { ...state, demobSeen: true };

    case 'DEV_SET_DAY': {
      const target = clamp(action.day, 1, MAX_DAY);
      const realDay = state.onboarded && state.lastShaveAt
        ? clamp(Math.floor((Date.now() - state.lastShaveAt) / DAY_MS) + 1, 1, MAX_DAY)
        : 1;
      const delta = Math.max(0, target - realDay);
      const newShaveCount = state.shaveCount + delta;
      const newLastShaveAt = Date.now() - (target - 1) * DAY_MS;
      const triggerBoots = delta > 0 && state.onboarded
        && Math.floor(newShaveCount / BOOTS_EVERY) > Math.floor(state.shaveCount / BOOTS_EVERY);
      const streakUpdatedAt = delta > 0 ? newLastShaveAt : state.streakUpdatedAt;
      return {
        ...state,
        onboarded: true,
        devDay: null,
        lastShaveAt: newLastShaveAt,
        shaveCount: newShaveCount,
        bootsDirty: triggerBoots || state.bootsDirty,
        bootsDialogDue: triggerBoots || state.bootsDialogDue,
        // В дев-режиме сохраняем игровой день тригера — expiry сравнит с computeDay.
        bootsDirtySinceDay: triggerBoots ? target : state.bootsDirtySinceDay,
        streakUpdatedAt,
      };
    }

    case 'DEV_SET_ONBOARDED':
      return {
        ...state,
        onboarded: action.value,
        shaveStage: 'none',
        devDay: null,
        lastShaveAt: action.value ? Date.now() : null,
      };

    case 'HYDRATE': {
      const lastShaveAt = Math.max(state.lastShaveAt ?? 0, action.lastShaveAt ?? 0) || null;
      const streak = Math.max(state.streak, action.streak ?? 0);
      const streakUpdatedAt = state.streakUpdatedAt ?? lastShaveAt;
      return { ...state, onboarded: state.onboarded || action.onboarded, lastShaveAt, streak, streakUpdatedAt };
    }

    case 'DEV_SET_SERVICE':
      return {
        ...state,
        devServiceStart: action.start !== undefined ? action.start : state.devServiceStart,
        devServiceEnd: action.end !== undefined ? action.end : state.devServiceEnd,
      };

    case 'DEV_TRIGGER_BOOTS':
      return {
        ...state,
        bootsDirty: true,
        bootsDialogDue: false,
        bootsDirtySinceDay: computeDay(state),
        onboarded: true,
        lastShaveAt: state.lastShaveAt ?? Date.now(),
      };

    case 'DEV_RESET':
      return { ...initialState };

    default:
      return state;
  }
}

// ── Селекторы ─────────────────────────────────────────────────────────────────

export function computeDay(state: GameState): number {
  if (!state.onboarded) return 0;
  if (state.devDay != null) return clamp(state.devDay, 1, MAX_DAY);
  if (!state.lastShaveAt) return 1;
  const passed = Math.floor((Date.now() - state.lastShaveAt) / DAY_MS);
  return clamp(passed + 1, 1, MAX_DAY);
}

export function isShaveable(state: GameState, day: number): boolean {
  if (!state.onboarded) return true;
  return day >= MAX_DAY;
}

export function spriteFor(state: GameState, day: number): string {
  if (state.shaveStage === 'foam') return FOAM;
  if (state.shaveStage === 'half') return HALVES[state.halfVariant];
  if (!state.onboarded) return UNSHAVEN;
  return daySprite(day);
}
