import { useState, useEffect } from 'react';
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => { const t = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debouncedValue;
}
