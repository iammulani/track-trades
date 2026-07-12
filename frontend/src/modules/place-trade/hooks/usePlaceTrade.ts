import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addTrade } from '../../trades'
import { useWatchlist } from '../../watchlist'
import {
  EMPTY_INDICATOR_DATA,
  EMPTY_STAGE_BASE_ANSWERS,
  EMPTY_TRADE_PARAMS,
  type ChecklistChecked,
  type IndicatorData,
  type StageBaseAnswers,
  type TradeParams,
} from '../types/placeTrade'

export const STEPS = [
  { id: 'setup', title: 'Trade Setup' },
  { id: 'stage-base', title: 'Stage & Base' },
  { id: 'technical', title: 'Technical Confirmation' },
  { id: 'week-range', title: '52-Week Range' },
  { id: 'final-checks', title: 'Final Checks' },
  { id: 'review', title: 'Review & Place' },
] as const

/** Orchestrates the place-trade stepper: loads the watchlist item, holds each
 * step's answers, and places the trade (creates it, removes the watched item). */
export function usePlaceTrade(watchlistId: string) {
  const { items, loading, error, removeItem } = useWatchlist()
  const item = useMemo(() => items.find((i) => i.id === watchlistId) ?? null, [items, watchlistId])

  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [tradeParams, setTradeParams] = useState<TradeParams>(EMPTY_TRADE_PARAMS)
  const [stageBaseAnswers, setStageBaseAnswers] = useState<StageBaseAnswers>(EMPTY_STAGE_BASE_ANSWERS)
  const [indicatorData, setIndicatorData] = useState<IndicatorData>(EMPTY_INDICATOR_DATA)
  const [indicatorChecklistChecked, setIndicatorChecklistChecked] = useState<ChecklistChecked>({})
  const [finalChecksChecked, setFinalChecksChecked] = useState<ChecklistChecked>({})
  const [placing, setPlacing] = useState(false)

  function toggleIndicatorChecklistItem(id: string) {
    setIndicatorChecklistChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleFinalChecksItem(id: string) {
    setFinalChecksChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const canProceed = useMemo(() => {
    switch (STEPS[stepIndex].id) {
      case 'setup':
        return tradeParams.entryPrice.trim() !== '' && tradeParams.quantity.trim() !== ''
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

  async function placeTrade() {
    if (!item) return
    setPlacing(true)
    try {
      await addTrade({
        symbol: item.symbol,
        side: item.side,
        quantity: Number(tradeParams.quantity),
        entryPrice: Number(tradeParams.entryPrice),
        entryTime: new Date().toISOString(),
      })
      await removeItem(item.id)
      navigate('/')
    } finally {
      setPlacing(false)
    }
  }

  return {
    item,
    loading,
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
    placing,
    placeTrade,
  }
}
