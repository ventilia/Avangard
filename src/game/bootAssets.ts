// Ассеты мини-игры «почисти берцы»: полы, обувь, грязь.

import floor1 from '../asset/background/floor/floor1.png';
import floor2 from '../asset/background/floor/floor2.png';
import floor3 from '../asset/background/floor/floor3.png';
import shoes1 from '../asset/shoes/shoes1.png';
import shoes2 from '../asset/shoes/shoes2.png';
import shoes3 from '../asset/shoes/shoes3.png';
import dirt1 from '../asset/shoes/dirt/dirt1.png';
import dirt2 from '../asset/shoes/dirt/dirt2.png';

export const BOOT_FLOORS = [floor1, floor2, floor3] as const;
export const BOOT_SHOES = [shoes1, shoes2, shoes3] as const;
export const BOOT_DIRT = [dirt1, dirt2] as const;

// Всё, что нужно предзагрузить для мгновенного входа в мини-игру.
export const BOOT_PRELOAD: readonly string[] = [
  ...BOOT_FLOORS,
  ...BOOT_SHOES,
  ...BOOT_DIRT,
];
