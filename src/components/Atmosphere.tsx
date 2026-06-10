

import { type CSSProperties } from 'react';


const DUST = Array.from({ length: 22 }, () => ({
  left: Math.random() * 100,
  size: 1.5 + Math.random() * 3,
  delay: Math.random() * 14,
  dur: 14 + Math.random() * 16,
  drift: (Math.random() * 2 - 1) * 26, // px бокового сноса за полёт
  max: 0.35 + Math.random() * 0.5,
}));

export function Atmosphere() {
  return (
    <>
      <div className="dust" aria-hidden>
        {DUST.map((d, i) => (
          <span
            key={i}
            style={
              {
                left: `${d.left}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                '--dur': `${d.dur}s`,
                '--delay': `${d.delay}s`,
                '--drift': `${d.drift}px`,
                '--max': d.max,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      <div className="flicker" aria-hidden />
    </>
  );
}
