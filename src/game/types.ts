
export const BASE_W = 405;
export const BASE_H = 720;


export const MAX_DAY = 7;
export const DAY_MS = 24 * 60 * 60 * 1000;


export type ShaveStage = 'none' | 'foam' | 'half';

export type GameState = {
  onboarded: boolean;
  lastShaveAt: number | null;
  shaveStage: ShaveStage;
  halfVariant: 0 | 1;
  devDay: number | null;
  devServiceStart: number | null; // дев-оверрайд старта службы (ts)
  devServiceEnd: number | null; // дев-оверрайд дембеля (ts)
};

export type GameAction =
  | { type: 'FOAM' }
  | { type: 'SHAVE'; halfVariant?: 0 | 1 }
  | { type: 'HYDRATE'; onboarded: boolean; lastShaveAt: number | null } // прогресс с сервера
  | { type: 'DEV_SET_DAY'; day: number }
  | { type: 'DEV_SET_ONBOARDED'; value: boolean }
  | { type: 'DEV_SET_SERVICE'; start?: number | null; end?: number | null }
  | { type: 'DEV_RESET' };
