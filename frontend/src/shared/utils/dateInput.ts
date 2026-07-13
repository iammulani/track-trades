/** Helpers for native `<input type="date">` fields that default to today but allow backdating. */

/** Today's date as yyyy-mm-dd (local time), for defaulting/capping a date input. */
export function todayDateValue(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Combines a yyyy-mm-dd date input value with the current time-of-day into an ISO timestamp. */
export function dateValueToIso(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
  const now = new Date()
  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ).toISOString()
}
