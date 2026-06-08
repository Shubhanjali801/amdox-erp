export const formatDate = (d: Date) => d.toISOString().split('T')[0];
export const addDays   = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };

