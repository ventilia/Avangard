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
  soundEnabled: true,
  demobSeen: false,
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
        return {
          ...state,
          shaveStage: 'none',
          onboarded: true,
          lastShaveAt: Date.now(),
          devDay: null,
          shaveCount: newCount,
          bootsDirty: triggerBoots ? true : state.bootsDirty,
          bootsDialogDue: triggerBoots ? true : state.bootsDialogDue,
        };
      }
      return state;

    case 'BOOTS_DIALOG_SHOWN':
      return { ...state, bootsDialogDue: false };

    case 'CLEAN_BOOTS':
      return { ...state, bootsDirty: false, bootsDialogDue: false };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'DEMOB_SEEN':
      return { ...state, demobSeen: true };

    case 'DEV_SET_DAY':
      return {
        ...state,
        onboarded: true,
        devDay: clamp(action.day, 1, MAX_DAY),
        lastShaveAt: state.lastShaveAt ?? Date.now(),
      };

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
      return { ...state, onboarded: state.onboarded || action.onboarded, lastShaveAt };
    }

    case 'DEV_SET_SERVICE':
      return {
        ...state,
        devServiceStart: action.start !== undefined ? action.start : state.devServiceStart,
        devServiceEnd: action.end !== undefined ? action.end : state.devServiceEnd,
      };

    case 'DEV_TRIGGER_BOOTS':
      // Берцы грязные, диалог уже показан, онбординг засчитан (берцы — пост-бритьё фича).
      return {
        ...state,
        bootsDirty: true,
        bootsDialogDue: false,
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
