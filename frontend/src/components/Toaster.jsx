// Simple global toast bus used by main.jsx.
const listeners = new Set();
let counter = 0;
const queue = [];

function emit(kind, message) {
  const id = ++counter;
  const item = { id, kind, message };
  queue.push(item);
  for (const l of listeners) l([...queue]);
  setTimeout(() => {
    const idx = queue.findIndex((x) => x.id === id);
    if (idx >= 0) queue.splice(idx, 1);
    for (const l of listeners) l([...queue]);
  }, 4000);
}

export const toast = {
  success: (m) => emit('success', m),
  error: (m) => emit('error', m),
  info: (m) => emit('info', m),
  subscribe: (l) => { listeners.add(l); l([...queue]); return () => listeners.delete(l); }
};

export function Toaster() {
  // Sub without React state to keep it stable across renders
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [items, setItems] = useStateLite();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`card max-w-sm border ${
          t.kind === 'error' ? 'border-red-300' : t.kind === 'success' ? 'border-ink-300' : 'border-ink-200'
        }`}>
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

// Tiny hook to avoid importing useState in two files
import { useEffect, useState } from 'react';
function useStateLite() {
  const [items, setItems] = useState([]);
  useEffect(() => toast.subscribe(setItems), []);
  return [items, setItems];
}
