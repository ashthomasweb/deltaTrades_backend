/* Chop/Noise Utils */

import { ExtTick, RequestParams } from '../types/types'

type NoiseOptions = {
  atrMultiplier: number
  alternationThreshold: number
  huggingRatio: number
  compBodyMult: number
  compFullThresh: number
}

type NoiseGroup = {
  [timestamp: string]: {
    start: string | undefined
    end: string | undefined
    data: ExtTick[]
  }
}

/**
 * Scans the dataset using a sliding window to detect and group all "noisy" regions
 * based on the selected noise detection strategy and algorithm parameters.
 *
 * @param data - Full array of extended tick data
 * @param noiseFunction - Function that evaluates whether a given window is noisy
 * @param requestParams - Parameters passed to the noise function
 * @returns An object grouping noisy windows by their starting timestamp
 */
export function getAllNoiseWindows(data: ExtTick[], requestParams: Partial<RequestParams>) {
  if (requestParams.algoParams === undefined) return
  let noiseWindows: ExtTick[][] = []
  let windowArray = []

  const options: NoiseOptions = {
    atrMultiplier: requestParams?.algoParams.atrMultiplier,
    alternationThreshold: requestParams?.algoParams.altThreshold,
    huggingRatio: requestParams?.algoParams.hugRatio,
    compBodyMult: requestParams?.algoParams.compBodyMult,
    compFullThresh: requestParams?.algoParams.compFullThresh,
  }

  const noiseWindowKey: string = requestParams.algoParams.noiseWindow
  const noiseFunction: Record<string, Function> = {
    NW1: isNoisyWindow1,
    NW2: isNoisyWindow2,
    NW3: isNoisyWindow3,
    NW4: isNoisyWindow4,
    NW5: isNoisyWindow5,
    NW6: isNoisyWindow6,
  }

  for (let i = 10; i < data.length; i++) {
    windowArray = data.slice(i - (+requestParams.algoParams.noiseWindowLength + 1), i - 1)
    if (noiseFunction[noiseWindowKey](windowArray, options)) {
      noiseWindows.push(windowArray)
    }
  }

  const group: NoiseGroup = {}
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

/**
 * Calculates the average true range (ATR) for a window of candles.
 * This is done using a simplified method: high - low per candle.
 *
 * @param data - Array of extended tick data
 * @returns The average range (high - low) across all ticks
 */
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
function isTickCloseHuggingMA(data: ExtTick[], atr: number, multiplier: number, threshold: number): boolean {
  const band = atr * multiplier

  const huggingTicksAvg =
    data.filter((tick) => {
      return Math.abs(tick.close - tick.movingAvg!) < band
    }).length / data.length

  return huggingTicksAvg >= threshold
}

/**
 * Determines if a sufficient number of candles have any part (wick or body) intersecting the moving average band.
 * This is stricter than checking close price or body center alone.
 *
 * @param data - Window of tick data
 * @param atr - Average true range for the window
 * @param multiplier - Threshold multiplier applied to ATR to define the hugging band
 * @param threshold - Minimum ratio of hugging candles required to return true
 * @returns Whether hugging conditions are met
 */
function findTickWickHuggingMaRatio(data: ExtTick[], atr: number, multiplier: number, threshold: number): boolean {
  const band = atr * multiplier

  const huggingCount =
    data.filter((tick) => {
      return tick.high >= tick.movingAvg! - band && tick.low <= tick.movingAvg! + band
    }).length / data.length

  return huggingCount >= threshold
}

function findTickBodyCenterHuggingMaRatio(
  data: ExtTick[],
  atr: number,
  multiplier: number,
  threshold: number,
): boolean {
  const band = atr * multiplier

  const huggingCount =
    data.filter((tick) => {
      return Math.abs((tick.open + tick.close) / 2 - tick.movingAvg!) < band
    }).length / data.length

  return huggingCount >= threshold
}

/**
 * Flags structurally compressed candles based on body size (relative to ATR)
 * and fullness percentage (body size relative to full candle range).
 * If enough candles are compressed, the entire window is flagged as noisy.
 *
 * @param data - Window of tick data
 * @param atr - Average true range for the window
 * @param bodySizeMultiplier - Multiplier of ATR used to define body compression
 * @param fullnessThreshold - Maximum body fullness (%) for a candle to be considered compressed
 * @returns Whether the window is structurally compressed
 */
function isStructurallyCompressed(
  data: ExtTick[],
  atr: any,
  bodySizeMultiplier = 0.25,
  fullnessThreshold = 15,
): boolean {
  const compressedCount = data.filter(
    (tick) =>
      Math.abs(tick.close - tick.open) < atr * bodySizeMultiplier && tick.candleBodyFullness < fullnessThreshold,
  ).length

  const ratio = compressedCount / data.length
  return ratio >= 0.5 // or whatever feels right for your style
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

export function isNoisyWindow1(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = isTickCloseHuggingMA(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && indecisive && alternating
}

export function isNoisyWindow2(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = isTickCloseHuggingMA(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && (indecisive || alternating)
}

export function isNoisyWindow3(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = isTickCloseHuggingMA(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}

export function isNoisyWindow4(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = findTickWickHuggingMaRatio(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}

export function isNoisyWindow5(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = findTickBodyCenterHuggingMaRatio(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}

export function isNoisyWindow6(data: ExtTick[], options: NoiseOptions): boolean {
  const atr = findAvgTrueRange(data)
  const hugging = findTickWickHuggingMaRatio(data, atr, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)
  const compression = isStructurallyCompressed(data, atr, options.compBodyMult, options.compFullThresh)

  let score = 0
  if (hugging) score++
  if (indecisive) score++
  if (alternating) score++
  if (compression) score++

  return score >= 2
}
