import { useEffect, useMemo, useState } from 'react'
import { todayDateValue } from '../../../shared/utils/dateInput'
import { computeCode33, type DebtEquityYear, type QuarterFinancials } from '../../fundamentals'
import { useWatchlist } from '../../watchlist'
import { generateQuarterPeriods } from '../utils/generateQuarters'
import { generateYearPeriods } from '../utils/generateYears'
import { previousQuarterPeriod } from '../utils/previousQuarter'
import { useFundamentalsAutosave, type FundamentalsState } from './useFundamentalsAutosave'

const EMPTY_QUARTER_FIELDS = { sales: '', netProfit: '', eps: '', operatingProfit: '', interest: '' }
const EMPTY_DEBT_EQUITY_FIELDS = { borrowings: '', equityCapital: '', reserves: '' }

/** Code 33 reads the most recent 3 quarter-over-quarter steps (4 quarters) — but each of those
 * 4 needs its own same-quarter-prior-year match to compute YoY growth at all, so a *scoreable*
 * default needs 8 quarters (~2 years), not 4. "Show earlier quarters" grows it from here. */
const DEFAULT_QUARTER_COUNT = 8

const EARLIER_QUARTERS_STEP = 4

/** Debt to Equity has no YoY dependency (each year derives independently), so the default window
 * is just "a reasonable amount of history to eyeball a trend," not a minimum needed to score. */
const DEFAULT_YEAR_COUNT = 7

const EARLIER_YEARS_STEP = 5

/** "As of" defaults to today's resolved quarter — a fresh visit is almost always "check this
 * stock now," not a blank prompt to fill in. Computed once per page load, not live, so the
 * pristine-guard below (which must equal this) can't drift out from under a save mid-session. */
const DEFAULT_AS_OF_PERIOD = previousQuarterPeriod(todayDateValue())

const DEFAULT_AS_OF_YEAR = String(new Date().getFullYear())

const PRISTINE: FundamentalsState = {
  asOfPeriod: DEFAULT_AS_OF_PERIOD,
  quarterCount: DEFAULT_QUARTER_COUNT,
  quarters: [],
  debtEquityAsOfYear: DEFAULT_AS_OF_YEAR,
  debtEquityYearCount: DEFAULT_YEAR_COUNT,
  debtEquityYears: [],
}

function blankQuarter(period: string): QuarterFinancials {
  return { period, ...EMPTY_QUARTER_FIELDS }
}

function blankDebtEquityYear(year: string): DebtEquityYear {
  return { year, ...EMPTY_DEBT_EQUITY_FIELDS }
}

/**
 * Orchestrates the Verify Fundamental page: loads the watchlist item, regenerates the quarter
 * grid from the chosen "as of" quarter and how many trailing quarters are shown, holds each
 * row's typed figures (auto-saved, and seeded back from a parked record when returning), and
 * derives the live Code 33 rating.
 */
export function useVerifyFundamental(watchlistItemId: string) {
  const { items, loading: watchlistLoading, error } = useWatchlist()
  const item = useMemo(
    () => items.find((i) => i.id === watchlistItemId) ?? null,
    [items, watchlistItemId],
  )

  const [asOfPeriod, setAsOfPeriodState] = useState(DEFAULT_AS_OF_PERIOD)
  const [quarterCount, setQuarterCount] = useState(DEFAULT_QUARTER_COUNT)
  const [quartersByPeriod, setQuartersByPeriod] = useState<Record<string, QuarterFinancials>>({})
  const [debtEquityAsOfYear, setDebtEquityAsOfYearState] = useState(DEFAULT_AS_OF_YEAR)
  const [debtEquityYearCount, setDebtEquityYearCount] = useState(DEFAULT_YEAR_COUNT)
  const [debtEquityYearsByYear, setDebtEquityYearsByYear] = useState<Record<string, DebtEquityYear>>({})
  // Hydration resolving and this local state catching up from it are two separate renders —
  // `seeded` is only set true in the same effect that finishes the catch-up, so the autosave
  // hook is never handed a "ready" state that's actually still stale. See useFundamentalsAutosave.
  const [seeded, setSeeded] = useState(false)

  // Picking a new "as of" quarter starts over at the default window — extending history is a
  // deliberate follow-up action, not something a fresh anchor date should carry over.
  function setAsOfPeriod(period: string) {
    setAsOfPeriodState(period)
    setQuarterCount(DEFAULT_QUARTER_COUNT)
  }

  function showEarlierQuarters() {
    setQuarterCount((count) => count + EARLIER_QUARTERS_STEP)
  }

  // Same "fresh anchor resets the window" rule as `setAsOfPeriod`, on the annual axis.
  function setDebtEquityAsOfYear(year: string) {
    setDebtEquityAsOfYearState(year)
    setDebtEquityYearCount(DEFAULT_YEAR_COUNT)
  }

  function showEarlierDebtEquityYears() {
    setDebtEquityYearCount((count) => count + EARLIER_YEARS_STEP)
  }

  const periods = useMemo(
    () => generateQuarterPeriods(asOfPeriod, quarterCount),
    [asOfPeriod, quarterCount],
  )

  const debtEquityPeriods = useMemo(
    () => generateYearPeriods(debtEquityAsOfYear, debtEquityYearCount),
    [debtEquityAsOfYear, debtEquityYearCount],
  )

  // Only rows inside the current period range are ever saved — moving "as of" drops rows
  // outside the new range rather than quietly keeping them around; blank rows aren't persisted.
  const savedQuarters = useMemo(
    () =>
      periods
        .map((period) => quartersByPeriod[period])
        .filter(
          (q): q is QuarterFinancials =>
            q !== undefined &&
            (q.sales !== '' ||
              q.netProfit !== '' ||
              q.eps !== '' ||
              !!q.operatingProfit ||
              !!q.interest),
        ),
    [periods, quartersByPeriod],
  )

  const savedDebtEquityYears = useMemo(
    () =>
      debtEquityPeriods
        .map((year) => debtEquityYearsByYear[year])
        .filter(
          (y): y is DebtEquityYear =>
            y !== undefined && (y.borrowings !== '' || y.equityCapital !== '' || y.reserves !== ''),
        ),
    [debtEquityPeriods, debtEquityYearsByYear],
  )

  const state: FundamentalsState = {
    asOfPeriod,
    quarterCount,
    quarters: savedQuarters,
    debtEquityAsOfYear,
    debtEquityYearCount,
    debtEquityYears: savedDebtEquityYears,
  }
  const autosave = useFundamentalsAutosave(watchlistItemId, state, PRISTINE, seeded)

  // A fresh item resets the catch-up flag — the record just hydrated belongs to the previous
  // item, and must not be treated as "ready" state for this one.
  useEffect(() => {
    setSeeded(false)
  }, [watchlistItemId])

  // Seed the page from the parked record once hydration resolves (record or none), then — in
  // that same render — mark local state caught up. Doing both together, not in two effects, is
  // what closes the gap: `seeded` only ever becomes true once every piece of local state already
  // reflects it, Debt to Equity's included.
  useEffect(() => {
    if (autosave.hydrating) return
    if (autosave.hydrated) {
      setAsOfPeriodState(autosave.hydrated.asOfPeriod)
      setQuarterCount(autosave.hydrated.quarterCount)
      const map: Record<string, QuarterFinancials> = {}
      // A quarter saved before Interest Coverage existed lacks operatingProfit/interest — merge
      // over blankQuarter() so every seeded row is fully populated, never partially undefined.
      for (const q of autosave.hydrated.quarters) map[q.period] = { ...blankQuarter(q.period), ...q }
      setQuartersByPeriod(map)

      setDebtEquityAsOfYearState(autosave.hydrated.debtEquityAsOfYear ?? DEFAULT_AS_OF_YEAR)
      setDebtEquityYearCount(autosave.hydrated.debtEquityYearCount ?? DEFAULT_YEAR_COUNT)
      const deMap: Record<string, DebtEquityYear> = {}
      for (const y of autosave.hydrated.debtEquityYears ?? []) deMap[y.year] = y
      setDebtEquityYearsByYear(deMap)
    }
    setSeeded(true)
  }, [autosave.hydrating, autosave.hydrated])

  // The rendered grid always covers every generated period, blank rows included — only what's
  // actually been typed into is written back (see `savedQuarters` above).
  const rows: QuarterFinancials[] = useMemo(
    () => periods.map((period) => quartersByPeriod[period] ?? blankQuarter(period)),
    [periods, quartersByPeriod],
  )

  const deYears: DebtEquityYear[] = useMemo(
    () => debtEquityPeriods.map((year) => debtEquityYearsByYear[year] ?? blankDebtEquityYear(year)),
    [debtEquityPeriods, debtEquityYearsByYear],
  )

  function updateQuarter(period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) {
    setQuartersByPeriod((prev) => ({
      ...prev,
      [period]: { ...(prev[period] ?? blankQuarter(period)), ...patch },
    }))
  }

  function updateDebtEquityYear(year: string, patch: Partial<Omit<DebtEquityYear, 'year'>>) {
    setDebtEquityYearsByYear((prev) => ({
      ...prev,
      [year]: { ...(prev[year] ?? blankDebtEquityYear(year)), ...patch },
    }))
  }

  const code33 = useMemo(() => computeCode33(rows), [rows])

  return {
    item,
    // Also waits on `seeded`, not just `autosave.hydrating` — otherwise the grid could flash
    // the pristine default for one render before the real record's values land.
    loading: watchlistLoading || autosave.hydrating || !seeded,
    error,
    asOfPeriod,
    setAsOfPeriod,
    rows,
    showEarlierQuarters,
    updateQuarter,
    code33,
    debtEquityAsOfYear,
    setDebtEquityAsOfYear,
    deYears,
    showEarlierDebtEquityYears,
    updateDebtEquityYear,
    saveStatus: autosave.status,
    savedAt: autosave.savedAt,
  }
}
