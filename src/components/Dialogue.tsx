// Реплика Олега — пиксельный «пузырь» с хвостиком.
export function Dialogue({ text }: { text: string }) {
  return (
    <div className="bubble">
      <p className="bubble__text">{text}</p>
    </div>
  );
}
