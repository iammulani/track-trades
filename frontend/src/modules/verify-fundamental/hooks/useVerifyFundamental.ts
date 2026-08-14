import { useEffect, useMemo, useState } from 'react'
import { todayDateValue } from '../../../shared/utils/dateInput'
import { computeCode33, type QuarterFinancials } from '../../fundamentals'
import { useWatchlist } from '../../watchlist'
import { generateQuarterPeriods } from '../utils/generateQuarters'
import { previousQuarterPeriod } from '../utils/previousQuarter'
import { useFundamentalsAutosave, type FundamentalsState } from './useFundamentalsAutosave'

const EMPTY_QUARTER_FIELDS = { sales: '', netProfit: '', eps: '' }

/** Code 33 reads the most recent 3 quarter-over-quarter steps (4 quarters) — but each of those
 * 4 needs its own same-quarter-prior-year match to compute YoY growth at all, so a *scoreable*
 * default needs 8 quarters (~2 years), not 4. "Show earlier quarters" grows it from here. */
const DEFAULT_QUARTER_COUNT = 8

const EARLIER_QUARTERS_STEP = 4

/** "As of" defaults to today's resolved quarter — a fresh visit is almost always "check this
 * stock now," not a blank prompt to fill in. Computed once per page load, not live, so the
 * pristine-guard below (which must equal this) can't drift out from under a save mid-session. */
const DEFAULT_AS_OF_PERIOD = previousQuarterPeriod(todayDateValue())

const PRISTINE: FundamentalsState = {
  asOfPeriod: DEFAULT_AS_OF_PERIOD,
  quarterCount: DEFAULT_QUARTER_COUNT,
  quarters: [],
}

function blankQuarter(period: string): QuarterFinancials {
  return { period, ...EMPTY_QUARTER_FIELDS }
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

  const periods = useMemo(
    () => generateQuarterPeriods(asOfPeriod, quarterCount),
    [asOfPeriod, quarterCount],
  )

  // Only rows inside the current period range are ever saved — moving "as of" drops rows
  // outside the new range rather than quietly keeping them around; blank rows aren't persisted.
  const savedQuarters = useMemo(
    () =>
      periods
        .map((period) => quartersByPeriod[period])
        .filter(
          (q): q is QuarterFinancials =>
            q !== undefined && (q.sales !== '' || q.netProfit !== '' || q.eps !== ''),
        ),
    [periods, quartersByPeriod],
  )

  const state: FundamentalsState = { asOfPeriod, quarterCount, quarters: savedQuarters }
  const autosave = useFundamentalsAutosave(watchlistItemId, state, PRISTINE, seeded)

  // A fresh item resets the catch-up flag — the record just hydrated belongs to the previous
  // item, and must not be treated as "ready" state for this one.
  useEffect(() => {
    setSeeded(false)
  }, [watchlistItemId])

  // Seed the page from the parked record once hydration resolves (record or none), then — in
  // that same render — mark local state caught up. Doing both together, not in two effects, is
  // what closes the gap: `seeded` only ever becomes true once `asOfPeriod`/`quarterCount`/
  // `quartersByPeriod` already reflect it.
  useEffect(() => {
    if (autosave.hydrating) return
    if (autosave.hydrated) {
      setAsOfPeriodState(autosave.hydrated.asOfPeriod)
      setQuarterCount(autosave.hydrated.quarterCount)
      const map: Record<string, QuarterFinancials> = {}
      for (const q of autosave.hydrated.quarters) map[q.period] = q
      setQuartersByPeriod(map)
    }
    setSeeded(true)
  }, [autosave.hydrating, autosave.hydrated])

  // The rendered grid always covers every generated period, blank rows included — only what's
  // actually been typed into is written back (see `savedQuarters` above).
  const rows: QuarterFinancials[] = useMemo(
    () => periods.map((period) => quartersByPeriod[period] ?? blankQuarter(period)),
    [periods, quartersByPeriod],
  )

  function updateQuarter(period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) {
    setQuartersByPeriod((prev) => ({
      ...prev,
      [period]: { ...(prev[period] ?? blankQuarter(period)), ...patch },
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
    saveStatus: autosave.status,
    savedAt: autosave.savedAt,
  }
}
