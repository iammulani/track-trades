import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createFundamentals,
  fetchFundamentalsFor,
  updateFundamentals,
  type DebtEquityYear,
  type FundamentalsRecord,
  type QuarterFinancials,
} from '../../fundamentals'

export type FundamentalsSaveStatus = 'idle' | 'saving' | 'saved'

/** Long enough that pasting a run of quarterly figures is one write, short enough that
 * closing the tab mid-entry loses nothing worth missing. */
const DEBOUNCE_MS = 800

export interface FundamentalsState {
  asOfPeriod: string
  quarterCount: number
  quarters: QuarterFinancials[]
  debtEquityAsOfYear: string
  debtEquityYearCount: number
  debtEquityYears: DebtEquityYear[]
}

// A quarter saved before Interest Coverage existed lacks operatingProfit/interest — backfilled
// to '' here the same way `useVerifyFundamental`'s seeding effect backfills them via
// `{ ...blankQuarter(period), ...q }` (same key order, so the two produce an identical JSON key
// for an untouched legacy quarter). Without this, every pre-existing quarter would permanently
// disagree with its own freshly-seeded copy and schedule a spurious save on load.
function normalizeQuarter(q: QuarterFinancials): QuarterFinancials {
  return { ...q, operatingProfit: q.operatingProfit ?? '', interest: q.interest ?? '' }
}

// The Debt to Equity fields are optional on `FundamentalsRecord` — added after Code 33 already
// had live records, so a pre-existing record predates them and simply lacks the keys. Falling
// back to `pristine`'s values (not a bare '' / 0 / []) matters: `useVerifyFundamental` seeds its
// local Debt to Equity state the same way (`?? DEFAULT_AS_OF_YEAR` etc, which *is* what `pristine`
// holds), so an untouched pre-existing record hydrates to the exact same key this produces —
// without this, the two would permanently disagree and every such record would schedule a
// spurious save the instant its page loads, even though nothing was typed.
function toState(record: FundamentalsRecord, pristine: FundamentalsState): FundamentalsState {
  return {
    asOfPeriod: record.asOfPeriod,
    quarterCount: record.quarterCount,
    quarters: record.quarters.map(normalizeQuarter),
    debtEquityAsOfYear: record.debtEquityAsOfYear ?? pristine.debtEquityAsOfYear,
    debtEquityYearCount: record.debtEquityYearCount ?? pristine.debtEquityYearCount,
    debtEquityYears: record.debtEquityYears ?? pristine.debtEquityYears,
  }
}

interface FundamentalsAutosave {
  /** True until the parked record (if any) has been looked up — the page must not render
   * its inputs before this resolves, or they'd flash empty then jump. */
  hydrating: boolean
  hydrated: FundamentalsRecord | null
  status: FundamentalsSaveStatus
  savedAt: string | null
}

/**
 * Persists one watchlist item's quarterly fundamentals to `/fundamentals` as they're filled:
 * looks up the parked record on mount, then debounce-writes every change back (POST the first
 * time, PATCH after). Unlike a place-trade draft, this record has no consuming action — there's
 * nothing to "submit," it just keeps saving indefinitely as the user returns quarter after
 * quarter to add rows.
 *
 * A page that was opened and closed untouched writes nothing — the state has to differ from
 * `pristine` before the first save, so browsing in and backing out can't litter the watchlist
 * with empty records.
 */
export function useFundamentalsAutosave(
  watchlistItemId: string,
  state: FundamentalsState,
  pristine: FundamentalsState,
  /** True only once the caller has finished seeding its local state from `hydrated` (or
   * confirmed there's nothing to seed). Hydration finishing and that seeding happening are two
   * separate renders — `hydrating` alone flips false a render *before* the caller's state has
   * caught up, and without this flag a debounced save can get scheduled against that stale,
   * still-pristine state and silently overwrite a real record. See `useVerifyFundamental`. */
  ready: boolean,
): FundamentalsAutosave {
  const [hydrating, setHydrating] = useState(true)
  const [hydrated, setHydrated] = useState<FundamentalsRecord | null>(null)
  const [status, setStatus] = useState<FundamentalsSaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const recordIdRef = useRef<string | null>(null)
  /** What's already on the server — a write is skipped when the state still matches it. */
  const savedKeyRef = useRef<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state

  const key = JSON.stringify(state)
  const pristineKey = JSON.stringify(pristine)

  useEffect(() => {
    let cancelled = false
    setHydrating(true)
    fetchFundamentalsFor(watchlistItemId)
      .then((record) => {
        if (cancelled || !record) return
        recordIdRef.current = record.id
        savedKeyRef.current = JSON.stringify(toState(record, pristine))
        setHydrated(record)
        setSavedAt(record.updatedAt)
        setStatus('saved')
      })
      .catch(() => {
        // A record we can't read shouldn't block entering fresh figures.
      })
      .finally(() => {
        if (!cancelled) setHydrating(false)
      })
    return () => {
      cancelled = true
    }
    // `pristine` is a stable module-level constant (see `PRISTINE` in `useVerifyFundamental`) —
    // listed for exhaustive-deps correctness, not because it ever actually changes and re-triggers this.
  }, [watchlistItemId, pristine])

  const save = useCallback(async () => {
    // Guards against the same stale-state window the scheduling effect below guards against —
    // this path also runs directly, unscheduled, from the flush-on-unmount effect, so it needs
    // its own copy of the check rather than trusting the caller only ever invokes it once ready.
    if (!ready) return
    const current = stateRef.current
    const currentKey = JSON.stringify(current)
    if (currentKey === savedKeyRef.current) return
    if (!recordIdRef.current && currentKey === pristineKey) return

    setStatus('saving')
    try {
      if (recordIdRef.current) {
        await updateFundamentals(recordIdRef.current, current)
      } else {
        const created = await createFundamentals({ watchlistItemId, ...current })
        recordIdRef.current = created.id
      }
      savedKeyRef.current = currentKey
      setSavedAt(new Date().toISOString())
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [watchlistItemId, pristineKey, ready])

  useEffect(() => {
    if (!ready) return
    if (hydrating) return
    if (key === savedKeyRef.current) return
    if (!recordIdRef.current && key === pristineKey) return
    const timer = setTimeout(() => void save(), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, pristineKey, hydrating, save, ready])

  // Leaving the page mid-debounce still flushes the last edit.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => () => void saveRef.current(), [])

  return { hydrating, hydrated, status, savedAt }
}
