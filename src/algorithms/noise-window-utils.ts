/* Chop/Noise Utils */

import { Logger } from '../__core/logger'
import { ExtTick, RequestParams } from '../types/types'

type NoiseOptions = {
  atrMultiplier: number
  alternationThreshold: number
  huggingRatio: number
}

/**
 * Scans the dataset using a sliding window to find and group all "noisy" regions
 * based on a provided noise detection function and request parameters.
 *
 * @param data - Full array of extended tick data
 * @param noiseFunction - Function that evaluates whether a given window is noisy
 * @param requestParams - Parameters passed to the noise function
 * @returns An object grouping noisy windows by their starting timestamp
 */
export function getAllNoiseWindows(
  data: ExtTick[],
  noiseFunction: (array: ExtTick[], options: NoiseOptions) => boolean,
  requestParams: Partial<RequestParams>,
) {
  if (requestParams.algoParams === undefined) return
  let noiseWindows: ExtTick[][] = []
  let windowArray = []
  const options: NoiseOptions = {
    atrMultiplier: requestParams?.algoParams.atrMultiplier,
    alternationThreshold: requestParams?.algoParams.altThreshold,
    huggingRatio: requestParams?.algoParams.hugRatio,
  }

  for (let i = 10; i < data.length; i++) {
    windowArray = data.slice(i - 7, i - 1)
    if (noiseFunction(windowArray, options)) {
      noiseWindows.push(windowArray)
    }
  }

  const group: any = {}
  for (const array of noiseWindows) {
    if (group[array[0].timestamp!] === undefined) {
      group[array[0].timestamp!] = {
        start: array[0].timestamp,
        end: array[array.length - 1].timestamp,
        data: [...array],
      }
    }
  }

  return group
}

/* Hugging average analysis functions */

const findAvgTrueRange = (data: ExtTick[]): number => {
  const ranges = data.map((t) => t.high - t.low)
  return ranges.reduce((sum, r) => sum + r, 0) / ranges.length
}

/**
 * Determines if a majority of ticks are "hugging" the moving average within an ATR-based range.
 *
 * @param data - Window of tick data
 * @param multiplier - Multiplier for average true range
 * @param threshold - Minimum ratio of hugging ticks to return true
 */
function isTickCloseHuggingMA(data: ExtTick[], multiplier: number, threshold: number): boolean {
  const huggingTicksAvg =
    data.filter((tick) => {
      return Math.abs(tick.close - tick.movingAvg!) < findAvgTrueRange(data) * multiplier
    }).length / data.length

  return huggingTicksAvg >= threshold
}

function findTickWickHuggingMaRatio(data: ExtTick[], multiplier: number, threshold: number): boolean {
  const band = findAvgTrueRange(data) * multiplier

  const huggingCount =
    data.filter((tick) => {
      return tick.high >= tick.movingAvg! - band && tick.low <= tick.movingAvg! + band
    }).length / data.length

  return huggingCount >= threshold
}

/**
 * Evaluates whether a window of candles is indecisive, meaning the
 * candle bodies are relatively small compared to their range.
 *
 * @param data - Window of tick data
 * @param threshold - Upper bound for average body-to-range ratio
 */
const analyzeWindowIndecision = (data: ExtTick[], threshold: number) => {
  const avgIndecision =
    data.reduce((acc, tick) => {
      const body = Math.abs(tick.close - tick.open)
      const range = tick.high - tick.low || 1
      return acc + body / range
    }, 0) / data.length

  const indecisive = avgIndecision < threshold
  return indecisive
}

/**
 * Checks if the direction of candles alternates frequently (green/red)
 *
 * @param data - Window of tick data
 * @param threshold - Minimum alternation ratio to be considered noisy
 */
function isAlternating(data: ExtTick[], threshold: number): boolean {
  const directions = data.map((tick) => {
    if (tick.close > tick.open) return 1
    if (tick.close < tick.open) return -1
    return 0 // tie
  })

  let alternations = 0
  let prev = directions[0]

  for (let i = 1; i < directions.length; i++) {
    const curr = directions[i]
    if (curr === 0) continue // skip ties
    if (prev !== 0 && curr !== prev) alternations++
    prev = curr
  }

  const alternationRatio = alternations / data.length
  return alternationRatio > threshold
}

/**
 * Noise Detection v1: Requires all 3 conditions (hugging, indecision, alternation) to be true.
 */
export function isNoisyWindow1(data: ExtTick[], options: NoiseOptions): boolean {
  const hugging = isTickCloseHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && indecisive && alternating
}

/**
 * Noise Detection v2: Requires hugging plus at least one of indecision or alternation.
 */
export function isNoisyWindow2(data: ExtTick[], options: NoiseOptions): boolean {
  const hugging = isTickCloseHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && (indecisive || alternating)
}

/**
 * Noise Detection v3: Requires at least 2 out of 3 conditions to be true.
 */
export function isNoisyWindow3(data: ExtTick[], options: NoiseOptions): boolean {
  const hugging = isTickCloseHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}

export function isNoisyWindow4(data: ExtTick[], options: NoiseOptions): boolean {
  const hugging = findTickWickHuggingMaRatio(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}
