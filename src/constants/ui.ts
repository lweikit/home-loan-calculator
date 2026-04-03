export type ViewState = 'input' | 'result';

export const CURRENCY_FORMAT = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const PERCENT_FORMAT = new Intl.NumberFormat('en-SG', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return CURRENCY_FORMAT.format(value);
}

export function formatPercent(value: number): string {
  return (value).toFixed(2) + '%';
}
