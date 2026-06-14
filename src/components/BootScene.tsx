// Мини-игра «почисти берцы»: экран загрузки → холст с грязью, стираемой пальцем/курсором.

import { useEffect, useRef, useState } from 'react';
import { BOOT_DIRT, BOOT_FLOORS, BOOT_SHOES } from '../game/bootAssets';
import { SFX } from '../game/sound';
import brushUrl from '../asset/shoes/brush.png';

const BRUSH_R = 20;            // меньше → дольше чистить
const DONE_THRESHOLD = 0.06;  // <6% грязи → готово (нужно очистить 94%)
const ERASE_ALPHA = 0.4;      // частичное стирание за проход → нужно 5-6 движений по одному месту
const CANVAS_SIZE = 256;

type Props = {
  soundEnabled: boolean;
  onDone: () => void;
};

export function BootScene({ soundEnabled, onDone }: Props) {
  const [assets] = useState(() => ({
    floor: BOOT_FLOORS[Math.floor(Math.random() * BOOT_FLOORS.length)],
    shoe: BOOT_SHOES[Math.floor(Math.random() * BOOT_SHOES.length)],
    dirt: BOOT_DIRT[Math.floor(Math.random() * BOOT_DIRT.length)],
  }));

  const [phase, setPhase] = useState<'loading' | 'cleaning'>('loading');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDown = useRef(false);
  const doneRef = useRef(false);
  const [progress, setProgress] = useState(1);
  const [finished, setFinished] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Переход с экрана загрузки к игре через 1.3с.
  useEffect(() => {
    const t = setTimeout(() => setPhase('cleaning'), 1300);
    return () => clearTimeout(t);
  }, []);

  // Рисуем грязь на холсте, маскируем по силуэту обуви.
  useEffect(() => {
    if (phase !== 'cleaning') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dirtImg = new Image();
    const shoeImg = new Image();

    dirtImg.onload = () => {
      shoeImg.onload = () => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(dirtImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // Обрезаем грязь по силуэту обуви — за пределами обуви пусто.
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(shoeImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.globalCompositeOperation = 'source-over';
      };
      shoeImg.src = assets.shoe;
    };
    dirtImg.src = assets.dirt;
  }, [phase, assets.dirt, assets.shoe]);

  function erase(cx: number, cy: number) {
    const canvas = canvasRef.current;
    if (!canvas || doneRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, BRUSH_R, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${ERASE_ALPHA})`;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    SFX.scrub(soundEnabled);
    checkDone(canvas);
  }

  function checkDone(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    let dirty = 0;
    const step = 16;
    const total = Math.floor(data.length / step);
    for (let i = 3; i < data.length; i += step) {
      if (data[i] > 20) dirty++;
    }
    const ratio = dirty / total;
    setProgress(ratio);

    if (ratio < DONE_THRESHOLD && !doneRef.current) {
      doneRef.current = true;
      setFinished(true);
      SFX.bootsDone(soundEnabled);
      setTimeout(onDone, 900);
    }
  }

  function toCanvasCoords(clientX: number, clientY: number): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
      ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
    ];
  }

  // .stage имеет transform: scale(), поэтому position:fixed внутри него
  // привязывается к stage, а не к вьюпорту. Конвертируем viewport→stage координаты.
  function toStageCoords(clientX: number, clientY: number): { x: number; y: number } {
    const stage = canvasRef.current?.closest('.stage') as HTMLElement | null;
    if (!stage) return { x: clientX, y: clientY };
    const rect = stage.getBoundingClientRect();
    const sx = rect.width / stage.offsetWidth;
    const sy = rect.height / stage.offsetHeight;
    return { x: (clientX - rect.left) / sx, y: (clientY - rect.top) / sy };
  }

  const cleanPct = Math.round((1 - progress) * 100);

  // ── Экран загрузки ────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="boot-scene">
        <div className="boot-bg" style={{ backgroundImage: `url(${assets.floor})` }} />
        <div className="boot-overlay" />
        <div className="boot-loading-screen">
          <div className="boot-loading-label">идём за щёткой</div>
          <div className="boot-loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  // ── Чистка ───────────────────────────────────────────────────────────────

  return (
    <div className="boot-scene">
      <div className="boot-bg" style={{ backgroundImage: `url(${assets.floor})` }} />
      <div className="boot-overlay" />

      <div className="boot-area">
        <div className="boot-shoe-wrap">
          <img
            className="boot-shoe"
            src={assets.shoe}
            alt="берцы"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="boot-dirt"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ touchAction: 'none', cursor: 'none' }}
            onPointerDown={(e) => {
              isDown.current = true;
              setCursorPos(toStageCoords(e.clientX, e.clientY));
              const [cx, cy] = toCanvasCoords(e.clientX, e.clientY);
              erase(cx, cy);
            }}
            onPointerMove={(e) => {
              setCursorPos(toStageCoords(e.clientX, e.clientY));
              if (!isDown.current) return;
              const [cx, cy] = toCanvasCoords(e.clientX, e.clientY);
              erase(cx, cy);
            }}
            onPointerUp={() => { isDown.current = false; }}
            onPointerLeave={() => { isDown.current = false; setCursorPos(null); }}
            onPointerCancel={() => { isDown.current = false; setCursorPos(null); }}
          />
        </div>
      </div>

      {/* Кастомный курсор-щётка */}
      {cursorPos && !finished && (
        <img
          src={brushUrl}
          className="boot-brush-cursor"
          style={{ left: cursorPos.x, top: cursorPos.y }}
          draggable={false}
          alt=""
        />
      )}

      <div className="boot-progress-wrap">
        <div className="boot-progress-bar">
          <div className="boot-progress-fill" style={{ width: `${cleanPct}%` }} />
        </div>
        <div className={`boot-progress-label${finished ? ' is-done' : ''}`}>
          {finished ? '✓ Готово!' : `${cleanPct}% чисто`}
        </div>
      </div>

      {!finished && (
        <div className="boot-hint">чисти пальцем</div>
      )}
    </div>
  );
}
