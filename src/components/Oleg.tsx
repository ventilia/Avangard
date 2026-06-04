import type { ReactNode } from 'react';
import type { Ritual } from '../config';

// Палитра спрайта.
const PAL: Record<string, string> = {
  C: '#5b6638', // пилотка
  S: '#d2493a', // звезда
  H: '#3a2a1d', // волосы / бровь
  K: '#e0aa77', // кожа
  N: '#c98c5a', // тень носа
  E: '#241a10', // глаза
  M: '#9c5a4a', // рот
  G: '#46532b', // воротник гимнастёрки
  O: '#2c361a', // пуговицы / тень
};
const STUBBLE = '#4f3f2e';

// Пиксельный Олег (заглушка 14×16). 'B' — клетки щетины: база — кожа, сверху щетина.
const SPRITE = [
  '  CCCCCCCCCC  ',
  ' CCCCCCCCCCCC ',
  ' CCCCCSSCCCCC ',
  ' HHHHHHHHHHHH ',
  ' HKKKKKKKKKKH ',
  ' HKKKKKKKKKKH ',
  ' KKEEKKKKEEKK ',
  ' KKKKKKKKKKKK ',
  ' KKKKKNNKKKKK ',
  ' KKKKKKKKKKKK ',
  ' BBKKMMMMKKBB ',
  ' BBBKKKKKKBBB ',
  ' KBBBBBBBBBBK ',
  ' GGGGGGGGGGGG ',
  ' GOGGGGGGGGOG ',
  '  GGGGGGGGGG  ',
];

export function Oleg({ stubble, flash }: { stubble: number; flash: Ritual['kind'] | null }) {
  const cells: ReactNode[] = [];

  // База: всё, включая клетки щетины (как кожа).
  SPRITE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ' ') continue;
      const color = ch === 'B' ? PAL.K : PAL[ch];
      if (color) cells.push(<rect key={`b${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={color} />);
    }
  });

  // Слой щетины поверх: прозрачность зависит от запущенности.
  if (stubble > 0.05) {
    SPRITE.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'B') {
          cells.push(<rect key={`s${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={STUBBLE} opacity={stubble} />);
        }
      }
    });
  }

  return (
    <div className="oleg" data-flash={flash ?? undefined}>
      <svg className="oleg__svg" viewBox="0 0 14 16" width="160" shapeRendering="crispEdges" aria-label="Пиксельный Олег">
        {cells}
      </svg>
      <div className="oleg__shadow" />
    </div>
  );
}
