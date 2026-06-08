export const today          = () => new Date().toISOString().split('T')[0];
export const addDays        = (date: string, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; };
export const diffDays       = (a: string, b: string) => Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
export const isOverdue      = (dueDate: string) => new Date(dueDate) < new Date();
export const formatMonth    = (year: number, month: number) => `${year}-${String(month).padStart(2,'0')}`;
