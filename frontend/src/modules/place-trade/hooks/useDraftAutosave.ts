import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createDraft,
  fetchDraftFor,
  removeDraft,
  updateDraft,
  type DraftStepperState,
  type TradeDraft,
} from '../../drafts'

export type DraftSaveStatus = 'idle' | 'saving' | 'saved'

/** Long enough that a burst of typing is one write, short enough that closing the tab
 * mid-step loses nothing worth missing. */
const DEBOUNCE_MS = 800

/** Only the stepper fields — drops the draft's id/watchlistId/timestamps. */
function toStepperState(draft: TradeDraft): DraftStepperState {
  return {
    stepIndex: draft.stepIndex,
    tradeParams: draft.tradeParams,
    stageBaseAnswers: draft.stageBaseAnswers,
    indicatorData: draft.indicatorData,
    indicatorChecklistChecked: draft.indicatorChecklistChecked,
    vcpStructureData: draft.vcpStructureData,
    finalChecksChecked: draft.finalChecksChecked,
  }
}

interface DraftAutosave {
  /** True until the parked draft (if any) has been looked up — the stepper must not
   * render its inputs before this resolves, or they'd flash empty then jump. */
  hydrating: boolean
  /** The draft found for this watchlist item — the state the stepper seeds itself from. */
  hydrated: TradeDraft | null
  hasDraft: boolean
  status: DraftSaveStatus
  savedAt: string | null
  /** Flushes the pending debounce now (the Review step's "Keep as Draft"). */
  saveNow: () => Promise<void>
  /** Deletes the draft and stops autosaving — placing the trade, or discarding the run. */
  discard: () => Promise<void>
}

/**
 * Persists one stepper run to `/drafts` as it's filled: looks up the parked draft on
 * mount, then debounce-writes every change back (POST the first time, PATCH after).
 *
 * A run that was opened and abandoned untouched writes nothing — the state has to differ
 * from `pristine` before the first save, so browsing into the stepper and backing out
 * can't litter the watchlist with empty drafts.
 */
export function useDraftAutosave(
  watchlistId: string,
  state: DraftStepperState,
  pristine: DraftStepperState,
): DraftAutosave {
  const [hydrating, setHydrating] = useState(true)
  const [hydrated, setHydrated] = useState<TradeDraft | null>(null)
  const [status, setStatus] = useState<DraftSaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const draftIdRef = useRef<string | null>(null)
  /** What's already on the server — a write is skipped when the state still matches it. */
  const savedKeyRef = useRef<string | null>(null)
  /** Set once the draft is deliberately gone (placed or discarded), so a late flush
   * can't resurrect it. */
  const stoppedRef = useRef(false)

  const stateRef = useRef(state)
  stateRef.current = state

  const key = JSON.stringify(state)
  const pristineKey = JSON.stringify(pristine)

  useEffect(() => {
    let cancelled = false
    setHydrating(true)
    fetchDraftFor(watchlistId)
      .then((draft) => {
        if (cancelled || !draft) return
        draftIdRef.current = draft.id
        savedKeyRef.current = JSON.stringify(toStepperState(draft))
        setHydrated(draft)
        setSavedAt(draft.updatedAt)
        setStatus('saved')
      })
      .catch(() => {
        // A draft we can't read shouldn't block placing the trade — start a fresh run.
      })
      .finally(() => {
        if (!cancelled) setHydrating(false)
      })
    return () => {
      cancelled = true
    }
  }, [watchlistId])

  const save = useCallback(async () => {
    if (stoppedRef.current) return
    const current = stateRef.current
    const currentKey = JSON.stringify(current)
    if (currentKey === savedKeyRef.current) return
    // Nothing has been entered yet — don't create a draft just because the page was opened.
    if (!draftIdRef.current && currentKey === pristineKey) return

    setStatus('saving')
    try {
      if (draftIdRef.current) {
        await updateDraft(draftIdRef.current, current)
      } else {
        const created = await createDraft({ watchlistId, ...current })
        draftIdRef.current = created.id
      }
      savedKeyRef.current = currentKey
      setSavedAt(new Date().toISOString())
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [watchlistId, pristineKey])

  useEffect(() => {
    if (hydrating || stoppedRef.current) return
    if (key === savedKeyRef.current) return
    if (!draftIdRef.current && key === pristineKey) return
    const timer = setTimeout(() => void save(), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, pristineKey, hydrating, save])

  // Leaving the page mid-debounce (Cancel, sidebar nav) still flushes the last edit.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => () => void saveRef.current(), [])

  const discard = useCallback(async () => {
    stoppedRef.current = true
    const id = draftIdRef.current
    draftIdRef.current = null
    setStatus('idle')
    setSavedAt(null)
    if (id) await removeDraft(id)
  }, [])

  return {
    hydrating,
    hydrated,
    // savedAt is set on hydration and on the first write, cleared on discard — unlike the
    // id ref, it's state, so the "Draft" pill appears the moment the draft exists.
    hasDraft: savedAt !== null,
    status,
    savedAt,
    saveNow: save,
    discard,
  }
}
