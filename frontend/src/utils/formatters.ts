export const fCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const fNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

export const fPercent = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;

export const fDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));

export const fDateTime = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
