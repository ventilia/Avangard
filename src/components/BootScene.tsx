// Мини-игра «почисти берцы»: холст с грязью, стираемой пальцем/курсором.
// Компонент монтируется поверх основной сцены через blink-переход.

import { useEffect, useRef, useState } from 'react';
import { BOOT_DIRT, BOOT_FLOORS, BOOT_SHOES } from '../game/bootAssets';
import { SFX } from '../game/sound';

// Радиус кисти в пикселях canvas-координат (256×256).
const BRUSH_R = 28;
// Порог очистки: меньше N% непрозрачных пикселей → готово.
const DONE_THRESHOLD = 0.13;
// Внутреннее разрешение холста.
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDown = useRef(false);
  const doneRef = useRef(false);
  const [progress, setProgress] = useState(1);   // 1 = полностью грязно
  const [finished, setFinished] = useState(false);

  // Рисуем грязь на холсте при загрузке компонента.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
    img.src = assets.dirt;
  }, [assets.dirt]);

  // Стираем грязь в точке (canvas-координаты).
  function erase(cx: number, cy: number) {
    const canvas = canvasRef.current;
    if (!canvas || doneRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, BRUSH_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    SFX.scrub(soundEnabled);
    checkDone(canvas);
  }

  // Проверяем долю оставшейся грязи: сэмплируем каждый 4-й пиксель.
  function checkDone(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    let dirty = 0;
    const step = 16; // каждые 4 пикселя (4 байта/пиксель)
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

  // Перевод экранных координат в координаты холста.
  function toCanvasCoords(clientX: number, clientY: number): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
      ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
    ];
  }

  const cleanPct = Math.round((1 - progress) * 100);

  return (
    <div className="boot-scene">
      {/* Пол — фоновая картинка */}
      <div className="boot-bg" style={{ backgroundImage: `url(${assets.floor})` }} />

      {/* Тёмный оверлей для читаемости */}
      <div className="boot-overlay" />

      {/* Обувь + холст с грязью */}
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
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              isDown.current = true;
              const [cx, cy] = toCanvasCoords(e.clientX, e.clientY);
              erase(cx, cy);
            }}
            onPointerMove={(e) => {
              if (!isDown.current) return;
              const [cx, cy] = toCanvasCoords(e.clientX, e.clientY);
              erase(cx, cy);
            }}
            onPointerUp={() => { isDown.current = false; }}
            onPointerLeave={() => { isDown.current = false; }}
            onPointerCancel={() => { isDown.current = false; }}
          />
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="boot-progress-wrap">
        <div className="boot-progress-bar">
          <div className="boot-progress-fill" style={{ width: `${cleanPct}%` }} />
        </div>
        <div className={`boot-progress-label${finished ? ' is-done' : ''}`}>
          {finished ? '✓ Готово!' : `${cleanPct}% чисто`}
        </div>
      </div>

      {/* Подсказка */}
      {!finished && (
        <div className="boot-hint">
          чисти пальцем
        </div>
      )}
    </div>
  );
}
