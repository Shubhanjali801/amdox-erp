export const isEmail   = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone   = (v: string) => /^\+?[\d\s\-()]{7,15}$/.test(v);
export const isUUID    = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const isNotEmpty= (v: string) => v.trim().length > 0;
export const minLength = (v: string, n: number) => v.length >= n;
