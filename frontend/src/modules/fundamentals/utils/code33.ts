import type { QuarterFinancials } from '../types/fundamentals'
import { deriveQuarters, type QuarterDerived } from './quarterlyCalc'

export const CODE33_STARS = 5

export type Code33Status = 'pending' | 'partial' | 'complete'

/** One quarter-over-quarter comparison inside the evaluation window. Each flag is a comparison
 * of two *already-YoY* figures (the quarter's growth vs. the previous window quarter's growth),
 * not the raw quarters against each other. */
export interface Code33Step {
  fromPeriod: string
  toPeriod: string
  epsAccelerated: boolean
  salesAccelerated: boolean
  marginExpanded: boolean
}

export interface Code33Rating {
  status: Code33Status
  /** hits / totalChecks. 0..1. */
  ratio: number
  stars: number
  /** How many of the 3 metrics (EPS/Sales/Margin) moved up, summed across every step — the
   * plain count `ratio`/`stars` are computed from, surfaced so the score can always be traced
   * back to "N of M checks passed" rather than taken on faith. */
  hits: number
  /** 3 metrics * step count — what `hits` is being counted out of. */
  totalChecks: number
  /** `hits` broken out per metric, each out of `steps.length` — lets the UI show *which* of the
   * 3 cylinders is actually carrying the score (e.g. "Sales 2/3") rather than just the total. */
  epsHits: number
  salesHits: number
  marginHits: number
  steps: Code33Step[]
}

function periodIndex(period: string): number {
  const [year, month] = period.split('-').map(Number)
  return year * 12 + (month - 1)
}

function isConsecutiveQuarter(prevPeriod: string, period: string): boolean {
  return periodIndex(period) - periodIndex(prevPeriod) === 3
}

function hasYoy(q: QuarterDerived): boolean {
  return q.netMargin !== null && q.epsGrowthYoY !== null && q.salesGrowthYoY !== null
}

/** The trailing run of period-consecutive quarters (ending at the most recent one) that all
 * carry YoY data. A gap — a blank row, or a skipped quarter — cuts the run rather than being
 * silently bridged, so the read always reflects the *current* unbroken streak. */
function trailingUsableRun(derived: QuarterDerived[]): QuarterDerived[] {
  let run: QuarterDerived[] = []
  for (const q of derived) {
    if (!hasYoy(q)) {
      run = []
      continue
    }
    if (run.length > 0 && !isConsecutiveQuarter(run[run.length - 1].period, q.period)) run = []
    run.push(q)
  }
  return run
}

/**
 * Mark Minervini's "Code 33": a company is hitting on all cylinders when EPS growth, Sales
 * growth, and Net Profit Margin all accelerate together for 3 consecutive quarters. Reads the
 * most recent up-to-4 period-consecutive quarters with full YoY data (3 step-comparisons) and
 * scores how many of the 9 possible "moved up" checks land — a single explainable fraction,
 * not a weighted formula, since this is one signal from one data source rather than several
 * blended together (contrast `computeTradeRating`, which does need gates/weights).
 *
 * Never frozen — recomputed live from the raw `quarters` on every call. Unlike a trade's
 * rating, there's no "moment of commitment" here: the user comes back every quarter and adds
 * a row, so the read has to reflect the current full history every time.
 */
export function computeCode33(quarters: QuarterFinancials[]): Code33Rating {
  const derived = deriveQuarters(quarters).slice().sort((a, b) => (a.period < b.period ? -1 : 1))
  const windowQuarters = trailingUsableRun(derived).slice(-4)

  // Fewer than 2 usable quarters means zero step-comparisons are possible — not yet
  // judgeable, and deliberately distinct from a "no acceleration" read.
  if (windowQuarters.length < 2) {
    return {
      status: 'pending',
      ratio: 0,
      stars: 0,
      hits: 0,
      totalChecks: 0,
      epsHits: 0,
      salesHits: 0,
      marginHits: 0,
      steps: [],
    }
  }

  const steps: Code33Step[] = []
  for (let i = 1; i < windowQuarters.length; i++) {
    const prev = windowQuarters[i - 1]
    const curr = windowQuarters[i]
    steps.push({
      fromPeriod: prev.period,
      toPeriod: curr.period,
      epsAccelerated: curr.epsGrowthYoY! > prev.epsGrowthYoY!,
      salesAccelerated: curr.salesGrowthYoY! > prev.salesGrowthYoY!,
      marginExpanded: curr.netMargin! > prev.netMargin!,
    })
  }

  const epsHits = steps.filter((s) => s.epsAccelerated).length
  const salesHits = steps.filter((s) => s.salesAccelerated).length
  const marginHits = steps.filter((s) => s.marginExpanded).length
  const hits = epsHits + salesHits + marginHits
  const totalChecks = steps.length * 3
  const ratio = hits / totalChecks

  return {
    status: windowQuarters.length >= 4 ? 'complete' : 'partial',
    ratio,
    stars: ratio * CODE33_STARS,
    hits,
    totalChecks,
    epsHits,
    salesHits,
    marginHits,
    steps,
  }
}

export interface Code33Verdict {
  label: string
  tone: 'good' | 'caution' | 'bad'
}

/** A quick read on a Code 33 rating. Stricter bands than `ratingVerdict` — "hitting on all
 * cylinders" is a closer-to-binary claim than a weighted trade score. */
export function code33Verdict(rating: Code33Rating): Code33Verdict {
  if (rating.status === 'pending') {
    return {
      label: 'Not enough consecutive quarters yet — show earlier quarters for the same-quarter-last-year matches',
      tone: 'caution',
    }
  }
  const suffix = rating.status === 'partial' ? ` (based on ${rating.steps.length} of 3 steps)` : ''
  const { ratio } = rating
  if (ratio === 1) return { label: `Full Code 33 — hitting on all cylinders${suffix}`, tone: 'good' }
  if (ratio >= 0.67) return { label: `Strong — most cylinders firing${suffix}`, tone: 'good' }
  if (ratio >= 0.34) return { label: `Mixed — some cylinders firing${suffix}`, tone: 'caution' }
  if (ratio > 0) return { label: `Weak — barely accelerating${suffix}`, tone: 'bad' }
  return { label: `No acceleration — flat or decelerating${suffix}`, tone: 'bad' }
}
