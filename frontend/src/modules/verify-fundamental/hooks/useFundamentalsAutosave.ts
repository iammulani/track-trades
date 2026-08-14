import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createFundamentals,
  fetchFundamentalsFor,
  updateFundamentals,
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
}

function toState(record: FundamentalsRecord): FundamentalsState {
  return { asOfPeriod: record.asOfPeriod, quarterCount: record.quarterCount, quarters: record.quarters }
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
        savedKeyRef.current = JSON.stringify(toState(record))
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
  }, [watchlistItemId])

  const save = useCallback(async () => {
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
  }, [watchlistItemId, pristineKey])

  useEffect(() => {
    if (hydrating) return
    if (key === savedKeyRef.current) return
    if (!recordIdRef.current && key === pristineKey) return
    const timer = setTimeout(() => void save(), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, pristineKey, hydrating, save])

  // Leaving the page mid-debounce still flushes the last edit.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => () => void saveRef.current(), [])

  return { hydrating, hydrated, status, savedAt }
}
