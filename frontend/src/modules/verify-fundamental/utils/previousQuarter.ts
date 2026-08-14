const QUARTER_END_MONTHS = [3, 6, 9, 12]

/** Local-date construction throughout — `new Date("YYYY-MM-DD")` parses as UTC midnight, which
 * can land a day early in negative-UTC-offset timezones. Same rule `shared/utils/dateInput.ts`
 * follows for every other date field in the app. */
function parseDateValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function quarterEndDate(year: number, month: number): Date {
  return new Date(year, month, 0) // day 0 of `month` = the last day of the month before it
}

/** The last day of a "YYYY-MM" quarter-end period, as a "YYYY-MM-DD" date value — what the
 * date input shows for a period that's already been picked. */
export function quarterEndDateValue(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const end = quarterEndDate(year, month)
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
}

/** Quarterly results only ever land on one of 4 fixed calendar quarter-ends, never an arbitrary
 * date — so rather than ask for a quarter directly, this takes any date and derives the most
 * recent quarter that had *already closed* by then (e.g. picking Aug 14 -> Jun, since the
 * Jul–Sep quarter isn't over yet; picking exactly Jun 30 -> Jun, since that quarter just closed;
 * picking Jun 29 -> Mar, since Apr–Jun is still one day short). */
export function previousQuarterPeriod(dateValue: string): string {
  if (!dateValue) return ''
  const picked = parseDateValue(dateValue)
  const year = picked.getFullYear()
  for (let i = QUARTER_END_MONTHS.length - 1; i >= 0; i--) {
    const month = QUARTER_END_MONTHS[i]
    if (quarterEndDate(year, month) <= picked) return `${year}-${String(month).padStart(2, '0')}`
  }
  return `${year - 1}-12`
}
