import { useEffect, useMemo, useRef, useState } from 'react';
import type { Script } from '../game/dialogues';
import { SFX } from '../game/sound';

const CHAR_MS = 26;
const OUT_MS = 200;

type Segment = { text: string; accent: boolean };

function parseSegments(page: string): Segment[] {
  return page
    .split('*')
    .map((text, i) => ({ text, accent: i % 2 === 1 }))
    .filter((s) => s.text.length > 0);
}

type Props = Script & { onClose: () => void; soundEnabled?: boolean };

export function Dialog({ speaker = 'Олег', pages, onClose, soundEnabled = true }: Props) {
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);
  const [closing, setClosing] = useState(false);
  const typeTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);

  const raw = pages[page] ?? '';
  const segments = useMemo(() => parseSegments(raw), [raw]);
  const plainLen = useMemo(() => segments.reduce((n, s) => n + s.text.length, 0), [segments]);

  const done = shown >= plainLen;
  const isLast = page >= pages.length - 1;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Тик на каждый символ при авто-печати (не при пропуске тапом).
  useEffect(() => {
    if (shown > 0 && shown < plainLen) SFX.tick(soundEnabledRef.current);
  }, [shown, plainLen]);

  useEffect(() => {
    setShown(0);
    if (typeTimer.current) clearInterval(typeTimer.current);
    typeTimer.current = window.setInterval(() => {
      setShown((s) => {
        if (s >= plainLen) {
          if (typeTimer.current) clearInterval(typeTimer.current);
          return s;
        }
        return s + 1;
      });
    }, CHAR_MS);
    return () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [page, plainLen]);

  useEffect(
    () => () => {
      if (outTimer.current) clearTimeout(outTimer.current);
    },
    [],
  );

  function advance() {
    if (closing) return;
    if (!done) {
      setShown(plainLen);
      SFX.dialogTap(soundEnabled);
      return;
    }
    if (!isLast) {
      SFX.dialogTap(soundEnabled);
      setPage((p) => p + 1);
      return;
    }
    SFX.dialogClose(soundEnabled);
    setClosing(true);
    outTimer.current = window.setTimeout(onClose, OUT_MS);
  }

  let used = 0;

  return (
    <div
      className={`dialog${closing ? ' is-closing' : ''}`}
      onClick={advance}
      role="button"
      tabIndex={0}
    >
      <div className="dialog-speaker">{speaker}</div>
      <div className="dialog-text">
        {segments.map((seg, i) => {
          const start = used;
          used += seg.text.length;
          const vis = Math.max(0, Math.min(seg.text.length, shown - start));
          if (vis <= 0) return null;
          const slice = seg.text.slice(0, vis);
          return seg.accent ? (
            <span key={i} className="dialog-accent">
              {slice}
            </span>
          ) : (
            <span key={i}>{slice}</span>
          );
        })}
        <span className="dialog-caret">▍</span>
      </div>

      {/* Подсказка: слева текст «нажмите, чтобы продолжить», справа стрелка/крест */}
      <div className="dialog-footer">
        <span className={`dialog-tap-hint${done ? ' is-ready' : ''}`}>
          нажмите, чтобы продолжить
        </span>
        <span className={`dialog-hint${done ? ' is-ready' : ''}`}>{isLast ? '✕' : '▸'}</span>
      </div>
    </div>
  );
}
