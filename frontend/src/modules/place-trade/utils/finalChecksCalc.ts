export type VcpTone = 'good' | 'caution' | 'bad' | 'none'

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** A textbook base runs 5-26 weeks — shorter hasn't shaken out weak holders yet, longer may be losing its edge. */
export function weeksInBaseTone(value: string): VcpTone {
  const n = toNumber(value)
  if (n === null) return 'none'
  if (n < 5) return 'bad'
  if (n <= 26) return 'good'
  return 'caution'
}

/** The best bases correct 15-25% off the high, in line with a Base 1/2 quality read. */
export function largestCorrectionTone(value: string): VcpTone {
  const n = toNumber(value)
  if (n === null) return 'none'
  if (n <= 25) return 'good'
  if (n <= 35) return 'caution'
  return 'bad'
}

/** The final, right-most contraction should be tight — the narrower, the closer to a proper pivot. */
export function narrowestPullbackTone(value: string): VcpTone {
  const n = toNumber(value)
  if (n === null) return 'none'
  if (n <= 10) return 'good'
  if (n <= 15) return 'caution'
  return 'bad'
}

/** A healthy VCP shows 2-4 contractions, each tighter than the last. */
export function contractionCountTone(value: string): VcpTone {
  const n = toNumber(value)
  if (n === null) return 'none'
  if (n < 2) return 'bad'
  if (n <= 4) return 'good'
  return 'caution'
}
