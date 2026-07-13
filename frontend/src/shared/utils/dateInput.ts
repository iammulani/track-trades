/** Helpers for native `<input type="date">` / `<input type="datetime-local">` fields
 * that default to now but allow backdating. */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Today's date as yyyy-mm-dd (local time), for defaulting/capping a date input. */
export function todayDateValue(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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

/** Now as yyyy-mm-ddThh:mm (local time), for defaulting/capping a datetime-local input. */
export function nowDateTimeLocalValue(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** A yyyy-mm-ddThh:mm datetime-local value (local time) -> an ISO timestamp. */
export function dateTimeLocalValueToIso(value: string): string {
  return new Date(value).toISOString()
}
