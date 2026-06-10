

export function Scene({ src }: { src: string }) {
  return (
    <>
      {/* */}
      <div className="bg" style={{ backgroundImage: `url("${src}")` }} />
      <div className="grade" />
      <div className="floor-fade" />
    </>
  );
}
