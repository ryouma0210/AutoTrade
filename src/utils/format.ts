export const yen = (value: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
export const number = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
export const percent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
export const shortDate = (iso: string) => new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
