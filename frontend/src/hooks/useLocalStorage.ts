import { useState } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  const set = (val: T) => { setValue(val); localStorage.setItem(key, JSON.stringify(val)); };
  const remove = () => { setValue(initialValue); localStorage.removeItem(key); };
  return [value, set, remove] as const;
}
