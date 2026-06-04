import { useState } from 'react';

export function App() {
  const [text, setText] = useState('');

  return (
    <main className="screen">
      <h1 className="title">пустырь</h1>
      <textarea
        className="field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="…"
        spellCheck={false}
      />
    </main>
  );
}
