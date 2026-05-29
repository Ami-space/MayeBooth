/**
 * Minimal date formatter — avoids external dependency for simple patterns.
 * Supports: YYYY, MM, DD, HH, mm, ss
 */
export function format(date: Date, pattern: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}
