

import sprite1 from '../asset/1.png';
import sprite2 from '../asset/2.png';
import sprite3 from '../asset/3.png';
import sprite4 from '../asset/4.png';
import sprite5 from '../asset/5.png';
import sprite6 from '../asset/6.png';
import sprite7 from '../asset/7.png';
import foam from '../asset/foam.png';
import half1 from '../asset/half1.png';
import half2 from '../asset/half2.png';

import { MAX_DAY } from './types';


export const SPRITES = [sprite1, sprite2, sprite3, sprite4, sprite5, sprite6, sprite7] as const;
export const FOAM = foam;
export const HALVES = [half1, half2] as const;


export const UNSHAVEN = SPRITES[MAX_DAY - 1];


export function daySprite(day: number): string {
  const i = Math.min(Math.max(day, 1), MAX_DAY) - 1;
  return SPRITES[i];
}
