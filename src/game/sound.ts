// Звуковой дизайн: 8-битные звуки через Web Audio API.
// Все звуки генерируются процедурно — нет файлов, нет сетевых запросов.
// AudioContext создаётся лениво при первом взаимодействии пользователя.

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return _ctx;
}

function resume(c: AudioContext) {
  if (c.state === 'suspended') void c.resume();
}

// Квадратная волна — классический 8-бит.
function sq(c: AudioContext, freq: number, dur: number, vol = 0.25, t0 = 0) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = 'square';
  osc.frequency.value = freq;
  const t = c.currentTime + t0;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Белый шум — для звука бритья.
function whiteNoise(c: AudioContext, dur: number, vol = 0.18) {
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  src.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.start(c.currentTime);
  src.stop(c.currentTime + dur + 0.02);
}

// Пилообразная волна — более «грязный» звук.
function saw(c: AudioContext, freq: number, dur: number, vol = 0.18, t0 = 0) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const t = c.currentTime + t0;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function play(enabled: boolean, fn: (c: AudioContext) => void) {
  if (!enabled) return;
  try {
    const c = getCtx();
    resume(c);
    fn(c);
  } catch {
    /* браузер без Audio API */
  }
}

// Последний скрип: ограничиваем частоту звука щётки.
let _lastScrub = 0;

export const SFX = {
  // Тап по кнопке / тап по Олегу.
  tap: (on: boolean) => play(on, (c) => sq(c, 440, 0.07, 0.18)),

  // Заблокированная кнопка.
  locked: (on: boolean) =>
    play(on, (c) => {
      sq(c, 220, 0.05, 0.14);
      sq(c, 165, 0.08, 0.14, 0.06);
    }),

  // Нанесение пены.
  foam: (on: boolean) =>
    play(on, (c) => {
      saw(c, 320, 0.10, 0.16);
      saw(c, 480, 0.08, 0.12, 0.06);
    }),

  // Бритьё (скольжение бритвы).
  shave: (on: boolean) => play(on, (c) => whiteNoise(c, 0.20, 0.22)),

  // Открытие диалога.
  dialogIn: (on: boolean) =>
    play(on, (c) => {
      sq(c, 440, 0.06, 0.18);
      sq(c, 660, 0.06, 0.16, 0.07);
    }),

  // Переключение страницы диалога.
  dialogTap: (on: boolean) => play(on, (c) => sq(c, 370, 0.05, 0.12)),

  // Закрытие диалога.
  dialogClose: (on: boolean) =>
    play(on, (c) => {
      sq(c, 440, 0.05, 0.14);
      sq(c, 330, 0.07, 0.14, 0.06);
    }),

  // Разблокировка кнопки «Почистить берцы» (фанфара).
  bootsAlert: (on: boolean) =>
    play(on, (c) => {
      [440, 550, 660].forEach((f, i) => sq(c, f, 0.10, 0.22, i * 0.08));
    }),

  // Звук чистки щёткой (ограничен по частоте).
  scrub: (on: boolean) => {
    const now = Date.now();
    if (now - _lastScrub < 55) return;
    _lastScrub = now;
    play(on, (c) => sq(c, 500 + Math.random() * 300, 0.04, 0.10));
  },

  // Берцы готовы! Победная мелодия.
  bootsDone: (on: boolean) =>
    play(on, (c) => {
      [523, 659, 784, 1047].forEach((f, i) => sq(c, f, 0.12, 0.26, i * 0.10));
    }),

  // Открытие меню.
  menuOpen: (on: boolean) => play(on, (c) => sq(c, 330, 0.08, 0.12)),

  // Дембель!
  demob: (on: boolean) =>
    play(on, (c) => {
      [330, 415, 494, 659, 784].forEach((f, i) => sq(c, f, 0.14, 0.28, i * 0.09));
    }),

  // Тик при появлении символа в диалоге (печатная машинка).
  tick: (on: boolean) => play(on, (c) => sq(c, 820, 0.016, 0.038)),

  // Стартовая заставка при первом открытии приложения.
  startup: (on: boolean) =>
    play(on, (c) => {
      // Короткий восходящий джингл: три ноты + финальный аккорд
      sq(c, 330, 0.10, 0.22, 0.0);
      sq(c, 400, 0.10, 0.20, 0.10);
      sq(c, 523, 0.10, 0.22, 0.20);
      sq(c, 523, 0.18, 0.28, 0.32);
      sq(c, 600, 0.18, 0.20, 0.20);
    }),
};
