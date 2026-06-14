
export const BASE_W = 405;
export const BASE_H = 720;

export const MAX_DAY = 7;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const BOOTS_EVERY = 3; // каждые N бритий → запрос почистить берцы

export type ShaveStage = 'none' | 'foam' | 'half';

export type GameState = {
  onboarded: boolean;
  lastShaveAt: number | null;
  shaveStage: ShaveStage;
  halfVariant: 0 | 1;
  devDay: number | null;
  devServiceStart: number | null;
  devServiceEnd: number | null;
  shaveCount: number;       // итоговое число полных бритий
  bootsDirty: boolean;      // берцы ждут чистки
  bootsDialogDue: boolean;  // диалог с просьбой ещё не показан
  soundEnabled: boolean;
  demobSeen: boolean;       // речь о дембеле уже показана
};

export type GameAction =
  | { type: 'FOAM' }
  | { type: 'SHAVE'; halfVariant?: 0 | 1 }
  | { type: 'HYDRATE'; onboarded: boolean; lastShaveAt: number | null }
  | { type: 'BOOTS_DIALOG_SHOWN' }
  | { type: 'CLEAN_BOOTS' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'DEMOB_SEEN' }
  | { type: 'DEV_SET_DAY'; day: number }
  | { type: 'DEV_SET_ONBOARDED'; value: boolean }
  | { type: 'DEV_SET_SERVICE'; start?: number | null; end?: number | null }
  | { type: 'DEV_TRIGGER_BOOTS' }
  | { type: 'DEV_RESET' };
