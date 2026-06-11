// Предзагрузка картинок: грузим И ДЕКОДИРУЕМ заранее, чтобы смена спрайта была
// мгновенной (без сетевой/декод-задержки на телефоне).

export function preloadImages(
  srcs: readonly string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const total = srcs.length;
  let loaded = 0;
  const bump = () => {
    loaded += 1;
    onProgress?.(loaded, total);
  };

  const one = (src: string): Promise<void> => {
    const img = new Image();
    img.src = src;
    // decode() гарантирует, что картинка готова к мгновенной отрисовке.
    if (typeof img.decode === 'function') {
      return img.decode().then(bump, bump); // даже при ошибке считаем «обработанной»
    }
    return new Promise<void>((resolve) => {
      img.onload = () => {
        bump();
        resolve();
      };
      img.onerror = () => {
        bump();
        resolve();
      };
    });
  };

  return Promise.all(srcs.map(one)).then(() => undefined);
}
