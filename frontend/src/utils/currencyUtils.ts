export const toMinorUnits  = (amount: number) => Math.round(amount * 100);
export const fromMinorUnits= (units: number)  => units / 100;
export const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;
export const formatCurrency= (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
