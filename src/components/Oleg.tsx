
import { type CSSProperties } from 'react';
import type { OlegPlacement } from '../scenes';

type Props = {
  src: string;
  placement: OlegPlacement;
};

export function Oleg({ src, placement }: Props) {

  const style: CSSProperties = {
    '--ox': `${placement.xPct ?? -2}%`,
    '--oleg-h': `${placement.heightVh ?? 82}%`,
    '--oleg-bottom': `${-(placement.dropVh ?? 10)}%`,
  } as CSSProperties;

  return (
    <>
      {/*  */}
      <div className="oleg-shadow" aria-hidden />
      <div className="oleg-wrap" style={style}>
        <img className="oleg" src={src} alt="Олег" draggable={false} />
      </div>
    </>
  );
}
