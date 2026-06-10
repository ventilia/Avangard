

type Props = { active: boolean };

export function BlinkOverlay({ active }: Props) {
  return (
    <div className={`blink${active ? ' is-on' : ''}`} aria-hidden>
      <span className="blink-top" />
      <span className="blink-bottom" />
    </div>
  );
}
