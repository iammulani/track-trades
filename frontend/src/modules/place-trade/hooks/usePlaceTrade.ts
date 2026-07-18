import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dateValueToIso, todayDateValue } from '../../../shared/utils/dateInput'
import type { DraftStepperState } from '../../drafts'
import { addTrade } from '../../trades'
import { useWatchlist } from '../../watchlist'
import {
  EMPTY_INDICATOR_DATA,
  EMPTY_STAGE_BASE_ANSWERS,
  EMPTY_TRADE_PARAMS,
  EMPTY_VCP_STRUCTURE_DATA,
  type ChecklistChecked,
  type IndicatorData,
  type StageBaseAnswers,
  type TradeParams,
  type VcpStructureData,
} from '../types/placeTrade'
import { computeWeeksInBase } from '../utils/finalChecksCalc'
import { computeTradeRating, toRatingSnapshot } from '../utils/tradeRating'
import { useDraftAutosave } from './useDraftAutosave'

/** "" -> null, else the parsed number — for optional numeric fields on submit. */
function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export const STEPS = [
  { id: 'setup', title: 'Trade Setup' },
  { id: 'stage-base', title: 'Stage & Base' },
  { id: 'technical', title: 'Technical Confirmation' },
  { id: 'week-range', title: '52-Week Range' },
  { id: 'vcp-structure', title: 'VCP Structure' },
  { id: 'final-checks', title: 'Final Checks' },
  { id: 'review', title: 'Review & Place' },
] as const

/** Before this step, an unchecked breakout-confirmation box hasn't been seen yet, so the
 * gate reads `pending`, not a failure — see `computeTradeRating`'s `hasReachedFinalChecks`. */
const FINAL_CHECKS_STEP_INDEX = STEPS.findIndex((s) => s.id === 'final-checks')

/** Orchestrates the place-trade stepper: loads the watchlist item, holds each step's
 * answers (auto-saved as a draft, and seeded back from one when resuming), and places
 * the trade (creates it, removes the watched item, drops the draft). */
export function usePlaceTrade(watchlistId: string) {
  const { items, loading, error, removeItem } = useWatchlist()
  const item = useMemo(() => items.find((i) => i.id === watchlistId) ?? null, [items, watchlistId])

  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [tradeParams, setTradeParams] = useState<TradeParams>(() => ({
    ...EMPTY_TRADE_PARAMS,
    entryDate: todayDateValue(),
  }))
  const [stageBaseAnswers, setStageBaseAnswers] = useState<StageBaseAnswers>(EMPTY_STAGE_BASE_ANSWERS)
  const [indicatorData, setIndicatorData] = useState<IndicatorData>(EMPTY_INDICATOR_DATA)
  const [indicatorChecklistChecked, setIndicatorChecklistChecked] = useState<ChecklistChecked>({})
  const [finalChecksChecked, setFinalChecksChecked] = useState<ChecklistChecked>({})
  const [vcpStructureData, setVcpStructureData] = useState<VcpStructureData>(EMPTY_VCP_STRUCTURE_DATA)
  const [placing, setPlacing] = useState(false)

  /** An untouched run — the baseline the autosave compares against, so merely opening
   * the stepper and backing out doesn't park an empty draft. */
  const pristine = useMemo<DraftStepperState>(
    () => ({
      stepIndex: 0,
      tradeParams: { ...EMPTY_TRADE_PARAMS, entryDate: todayDateValue() },
      stageBaseAnswers: EMPTY_STAGE_BASE_ANSWERS,
      indicatorData: EMPTY_INDICATOR_DATA,
      indicatorChecklistChecked: {},
      vcpStructureData: EMPTY_VCP_STRUCTURE_DATA,
      finalChecksChecked: {},
    }),
    [],
  )

  const state: DraftStepperState = {
    stepIndex,
    tradeParams,
    stageBaseAnswers,
    indicatorData,
    indicatorChecklistChecked,
    vcpStructureData,
    finalChecksChecked,
  }

  const draft = useDraftAutosave(watchlistId, state, pristine)

  // Seed the stepper from the parked draft, once, when it lands.
  useEffect(() => {
    if (!draft.hydrated) return
    setStepIndex(draft.hydrated.stepIndex)
    setTradeParams(draft.hydrated.tradeParams)
    setStageBaseAnswers(draft.hydrated.stageBaseAnswers)
    setIndicatorData(draft.hydrated.indicatorData)
    setIndicatorChecklistChecked(draft.hydrated.indicatorChecklistChecked)
    setVcpStructureData(draft.hydrated.vcpStructureData)
    setFinalChecksChecked(draft.hydrated.finalChecksChecked)
  }, [draft.hydrated])

  const rating = useMemo(
    () =>
      computeTradeRating({
        side: item?.side ?? 'long',
        tradeParams,
        stageBaseAnswers,
        indicatorData,
        indicatorChecklistChecked,
        vcpStructureData,
        finalChecksChecked,
        hasReachedFinalChecks: stepIndex >= FINAL_CHECKS_STEP_INDEX,
      }),
    [
      item,
      tradeParams,
      stageBaseAnswers,
      indicatorData,
      indicatorChecklistChecked,
      vcpStructureData,
      finalChecksChecked,
      stepIndex,
    ],
  )

  function toggleIndicatorChecklistItem(id: string) {
    setIndicatorChecklistChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleFinalChecksItem(id: string) {
    setFinalChecksChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const canProceed = useMemo(() => {
    switch (STEPS[stepIndex].id) {
      case 'setup':
        return (
          tradeParams.entryPrice.trim() !== '' &&
          tradeParams.quantity.trim() !== '' &&
          tradeParams.entryDate.trim() !== ''
        )
      case 'stage-base':
        return stageBaseAnswers.stage !== null && stageBaseAnswers.base !== null
      case 'week-range':
        return indicatorData.week52Low.trim() !== '' && indicatorData.week52High.trim() !== ''
      default:
        return true
    }
  }, [stepIndex, tradeParams, stageBaseAnswers, indicatorData])

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  /** Park the run and step away — the point of a draft: come back and re-read it. */
  async function saveDraftAndExit() {
    await draft.saveNow()
    navigate('/watchlist')
  }

  /** Throw the run away. Only offered from inside the stepper — you have to be looking at
   * what you're about to lose. The symbol stays on the watchlist. */
  async function discardDraft() {
    await draft.discard()
    navigate('/watchlist')
  }

  async function placeTrade() {
    if (!item) return
    setPlacing(true)
    try {
      await addTrade({
        symbol: item.symbol,
        side: item.side,
        quantity: Number(tradeParams.quantity),
        entryPrice: Number(tradeParams.entryPrice),
        entryTime: dateValueToIso(tradeParams.entryDate),
        setup: {
          watchedSince: item.watchedSince,
          stopLoss: numberOrNull(tradeParams.stopLoss),
          target: numberOrNull(tradeParams.target),
          stage: stageBaseAnswers.stage,
          base: stageBaseAnswers.base,
          rsi: numberOrNull(indicatorData.rsi),
          fiftyDayMa: numberOrNull(indicatorData.fiftyDayMa),
          technicalChecklist: indicatorChecklistChecked,
          week52Low: numberOrNull(indicatorData.week52Low),
          week52High: numberOrNull(indicatorData.week52High),
          weeksInBase: computeWeeksInBase(vcpStructureData.baseStartDate, vcpStructureData.baseEndDate),
          vcpContractions: vcpStructureData.contractions
            .filter((c) => c.high.trim() !== '' && c.low.trim() !== '')
            .map((c) => ({ high: Number(c.high), low: Number(c.low) })),
          finalChecks: finalChecksChecked,
          // Frozen here and never recomputed — the grade this setup earned on the day it
          // was taken, not what today's formula would say about it.
          rating: toRatingSnapshot(rating),
        },
      })
      await removeItem(item.id)
      // It's a trade now, not a run in progress.
      await draft.discard()
      navigate('/')
    } finally {
      setPlacing(false)
    }
  }

  return {
    item,
    loading: loading || draft.hydrating,
    error,
    steps: STEPS,
    stepIndex,
    goNext,
    goBack,
    canProceed,
    tradeParams,
    setTradeParams,
    stageBaseAnswers,
    setStageBaseAnswers,
    indicatorData,
    setIndicatorData,
    indicatorChecklistChecked,
    toggleIndicatorChecklistItem,
    finalChecksChecked,
    toggleFinalChecksItem,
    vcpStructureData,
    setVcpStructureData,
    rating,
    placing,
    placeTrade,
    hasDraft: draft.hasDraft,
    draftStatus: draft.status,
    draftSavedAt: draft.savedAt,
    saveDraftAndExit,
    discardDraft,
  }
}
