export const truncate = (str: string, len = 50) => str.length > len ? str.slice(0, len) + '...' : str;
export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const generateId = () => Math.random().toString(36).slice(2, 10);
