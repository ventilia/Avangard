import type { Ritual } from '../config';

// Главная кнопка: выполнить дневной ритуал.
export function ActionButton({
  ritual,
  done,
  onDo,
}: {
  ritual: Ritual;
  done: boolean;
  onDo: () => void;
}) {
  return (
    <button className="action" data-kind={ritual.kind} disabled={done} onClick={onDo}>
      <span className="action__sub">{done ? 'на сегодня выполнено' : ritual.title}</span>
      <span className="action__cta">{done ? 'до завтра, боец' : ritual.cta}</span>
    </button>
  );
}
