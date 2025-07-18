import { TickArray, RequestParams, Tick } from '@/types'

type AvgType = 'default' | 'typicalPrice' | 'OHLCAverage'

const avgTypeFns = {
  default: (tick: Tick) => tick.close,
  typicalPrice: (tick: Tick) => (tick.high + tick.low + tick.close) / 3,
  OHLCAverage: (tick: Tick) => (tick.open + tick.high + tick.low + tick.close) / 4,
}

export const calculateSMA1 = (
  data: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined => {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const avgPeriod: number = +requestParams.algoParams.simpleAvgPeriod1 // TODO: rename param
  const avgType: AvgType = requestParams.algoParams.maAvgType

  const analysisPacket = {
    data: new Array(data.length).fill(null),
    type: 'line',
    smooth: true,
  }

  for (let i = avgPeriod - 1; i < data.length; i++) {
    const window = data.slice(i - avgPeriod + 1, i + 1)
    const sum = window.reduce((acc, tick) => acc + avgTypeFns[avgType](tick), 0)
    analysisPacket.data[i] = sum / avgPeriod
  }

  return analysisPacket
}

export function calculateEMA1(
  ticks: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const avgPeriod: number = +requestParams.algoParams.emaAvgPeriod1
  const avgType: AvgType = requestParams.algoParams.maAvgType

  const k = 2 / (avgPeriod + 1)

  let prev: number | null = null

  const analysisPacket = {
    data: new Array(ticks.length).fill(null),
    type: 'line',
    smooth: true,
  }

  for (let i = 0; i < ticks.length; i++) {
    const price = ticks[i].close
    if (i < avgPeriod - 1) {
      analysisPacket.data[i] = null
    } else if (i === avgPeriod - 1) {
      const slice = ticks.slice(i - avgPeriod + 1, i + 1)
      const sma = slice.reduce((sum, tick) => sum + avgTypeFns[avgType](tick), 0) / avgPeriod
      analysisPacket.data[i] = sma
      prev = sma
    } else {
      const next: number = price * k + prev! * (1 - k)
      analysisPacket.data[i] = next
      prev = next
    }
  }

  return analysisPacket
}

export function calculateEMA2(
  ticks: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const avgPeriod: number = +requestParams.algoParams.emaAvgPeriod2
  const avgType: AvgType = requestParams.algoParams.maAvgType

  const k = 2 / (avgPeriod + 1)

  let prev: number | null = null

  const analysisPacket = {
    data: new Array(ticks.length).fill(null),
    type: 'line',
    smooth: true,
  }

  for (let i = 0; i < ticks.length; i++) {
    const price = ticks[i].close
    if (i < avgPeriod - 1) {
      analysisPacket.data[i] = null
    } else if (i === avgPeriod - 1) {
      const slice = ticks.slice(i - avgPeriod + 1, i + 1)
      const sma = slice.reduce((sum, tick) => sum + avgTypeFns[avgType](tick), 0) / avgPeriod
      analysisPacket.data[i] = sma
      prev = sma
    } else {
      const next: number = price * k + prev! * (1 - k)
      analysisPacket.data[i] = next
      prev = next
    }
  }

  return analysisPacket
}

export function getPercentSlopeByPeriod(
  data: TickArray | any[],
  index: number,
  requestParams: Partial<RequestParams>,
  type: string,
): number | null {
  if (!requestParams.algoParams) return null // TODO: This is a weak narrowing clause...
  let period

  switch (type) {
    case 'close':
      period = +requestParams.algoParams.slopePeriodRawPrice
      break

    case 'sma':
      period = +requestParams.algoParams.slopePeriodSMA
      break

    case 'ema':
      period = +requestParams.algoParams.slopePeriodEMA
      break

    default:
      break
  }

  if (index <= period) return null

  let curr
  let prev

  switch (type) {
    case 'close':
      curr = data[index].close
      prev = data[index - period].close
      break

    case 'ema':
      curr = data[index]
      prev = data[index - period]
      break

    case 'sma':
      curr = data[index]
      prev = data[index - period]
      break

    default:
      break
  }

  if (prev === 0 || isNaN(prev) || isNaN(curr)) return null

  // Percent change over `period` bars
  return ((curr - prev) / prev) * 100
}

export function getPriceSlopeByPeriod(
  ticks: TickArray,
  index: number,
  requestParams: Partial<RequestParams>,
): number | null {
  if (!requestParams.algoParams) return null // TODO: This is a weak narrowing clause...
  const period = +requestParams.algoParams.slopePeriodRawPrice
  if (index < period) return null

  const curr = ticks[index].close
  const prev = ticks[index - period].close

  if (prev === 0 || isNaN(prev) || isNaN(curr)) return null

  // Percent change over `period` bars
  return (curr - prev) / period
}

export function calculateADX(ticks: TickArray, requestParams: Partial<RequestParams>): (number | null)[] | null {
  if (!requestParams.algoParams) return null // TODO: This is a weak narrowing clause...
  const period = requestParams.algoParams.adxPeriod
  if (ticks.length <= period) return new Array(ticks.length).fill(null)

  const adxResults: (number | null)[] = new Array(ticks.length).fill(null)

  const tr: number[] = []
  const plusDM: number[] = []
  const minusDM: number[] = []

  for (let i = 1; i < ticks.length; i++) {
    const curr = ticks[i]
    const prev = ticks[i - 1]

    const upMove = curr.high - prev.high
    const downMove = prev.low - curr.low

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)

    tr.push(Math.max(curr.high - curr.low, Math.abs(curr.high - prev.close), Math.abs(curr.low - prev.close)))
  }

  const smooth = (arr: number[]): number[] => {
    const result = []
    let sum = arr.slice(0, period).reduce((a, b) => a + b, 0)
    result[period - 1] = sum
    for (let i = period; i < arr.length; i++) {
      sum = result[i - 1] - result[i - 1] / period + arr[i]
      result[i] = sum
    }
    return result
  }

  const smoothedTR = smooth(tr)
  const smoothedPlusDM = smooth(plusDM)
  const smoothedMinusDM = smooth(minusDM)

  const dx: (number | null)[] = new Array(ticks.length).fill(null)

  for (let i = period - 1; i < ticks.length - 1; i++) {
    const trVal = smoothedTR[i]
    const plus = (smoothedPlusDM[i] / trVal) * 100
    const minus = (smoothedMinusDM[i] / trVal) * 100
    const diDiff = Math.abs(plus - minus)
    const diSum = plus + minus
    dx[i + 1] = diSum === 0 ? 0 : (diDiff / diSum) * 100
  }

  const adx: (number | null)[] = []
  let adxSum: number | null = 0

  for (let i = 0; i < dx.length; i++) {
    if (i < 2 * period) {
      adx.push(null)
      continue
    }
    if (i === 2 * period) {
      adxSum = dx.slice(i - period + 1, i + 1).reduce((a, b) => a + (b ?? 0), 0)
      if (adxSum) {
        adx[i] = adxSum / period
      }
    } else {
      adxSum = ((adx[i - 1] ?? 0) * (period - 1) + (dx[i] ?? 0)) / period
      adx[i] = adxSum
    }
  }

  for (let i = 0; i < adx.length; i++) {
    adxResults[i] = adx[i]
  }

  return adxResults
}

export const MACrossover = (
  fastMaArray: (number | null)[] | undefined, // Shorter period Moving Average
  slowMaArray: (number | null)[] | undefined, // Longer period Moving Average
  index: number,
): { crossing: boolean; direction: 'bullish' | 'bearish' | undefined } => {
  if (fastMaArray === undefined || slowMaArray === undefined) return { crossing: false, direction: undefined }
  let direction: 'bullish' | 'bearish' | undefined
  let crossing: boolean
  let prevFastMa = fastMaArray[index - 1]
  let prevSlowMa = slowMaArray[index - 1]
  let currFastMa = fastMaArray[index]
  let currSlowMa = slowMaArray[index]

  if (prevFastMa === null || prevSlowMa === null || currFastMa === null || currSlowMa === null)
    return { crossing: false, direction: undefined }

  if (prevFastMa < prevSlowMa && currFastMa > currSlowMa) {
    direction = 'bullish'
    crossing = true
  } else if (prevFastMa > prevSlowMa && currFastMa < currSlowMa) {
    direction = 'bearish'
    crossing = true
  } else {
    direction = undefined
    crossing = false
  }
  return { crossing, direction }
}

export const bollingerBreakout = (tick: Tick, bollingerSeries: any, index: number) => {
  if (bollingerSeries[0].data[index] === null) return false
  return tick.close > bollingerSeries[0].data[index] ? true : false
}

type MACDResult = {
  macdLine: (number | null)[]
  signalLine: (number | null)[]
  histogram: (number | null)[]
}

export function calculateMACD(data: TickArray, requestParams: Partial<RequestParams>): MACDResult | undefined {
  if (!requestParams.algoParams) return undefined
  const shortPeriod = +requestParams.algoParams.macdShortPeriod
  const longPeriod = +requestParams.algoParams.macdLongPeriod
  const signalPeriod = +requestParams.algoParams.macdSignalPeriod

  const closes = data.map((entry) => {
    return entry.close
  })

  const macdResults: MACDResult = {
    macdLine: [],
    signalLine: [],
    histogram: [],
  }

  const k = (n: number) => 2 / (n + 1)

  function ema(arr: number[], period: number): number[] {
    const result: number[] = []
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
      if (i < period) {
        sum += arr[i]
        result.push(NaN)
      } else if (i === period) {
        const avg = sum / period
        result.push(avg)
      } else {
        const prev = result[i - 1]
        const next = (arr[i] - prev) * k(period) + prev
        result.push(next)
      }
    }
    return result
  }

  const shortEma = ema(closes, shortPeriod)
  const longEma = ema(closes, longPeriod)

  const macdLine: (number | null)[] = closes.map((_, i) =>
    isNaN(shortEma[i]) || isNaN(longEma[i]) ? null : shortEma[i] - longEma[i],
  )

  const signalLine: (number | null)[] = ema(
    macdLine.map((x) => x ?? 0),
    signalPeriod,
  ).map((val, i) => (macdLine[i] === null ? null : val))

  const histogram: (number | null)[] = macdLine.map((val, i) =>
    val === null || signalLine[i] === null ? null : val - signalLine[i],
  )

  for (let i = 0; i < closes.length; i++) {
    macdResults.macdLine.push(macdLine[i])
    macdResults.signalLine.push(signalLine[i])
    macdResults.histogram.push(histogram[i])
  }

  return macdResults
}

export const getBearishEngulfingScore = (
  data: TickArray,
  index: number,
  requestParams: Partial<RequestParams>,
  // tolerance: number = 0.005
): number | null => {
  if (!requestParams.algoParams) return null
  if (index < 1) return null
  const tolerance = +requestParams.algoParams.bearEngTolerance

  const prev = data[index - 1]
  const curr = data[index]

  const prevBullish = prev.close > prev.open
  const currBearish = curr.close < curr.open
  if (!prevBullish || !currBearish) return 0

  const prevBody = Math.abs(prev.close - prev.open)
  const currBody = Math.abs(curr.close - curr.open)

  // Handle flat candles
  if (prevBody === 0 || currBody === 0) return 0

  // How much of the previous body is covered?
  const engulfStart = Math.max(curr.close, curr.open)
  const engulfEnd = Math.min(curr.close, curr.open)
  const engulfedAmount = Math.max(
    0,
    engulfStart - engulfEnd - Math.max(0, engulfStart - prev.close) - Math.max(0, prev.open - engulfEnd),
  )
  const engulfPercent = Math.min(1, engulfedAmount / prevBody)

  const bodyRatio = currBody / prevBody

  const gappedUp = curr.open > prev.close * (1 + tolerance)
  const closedBelowPrevOpen = curr.close < prev.open

  const gapBonus = gappedUp ? 0.1 : 0
  const closeBelowBonus = closedBelowPrevOpen ? 0.1 : 0

  const confidence =
    engulfPercent * 0.5 +
    Math.min(bodyRatio, 2) * 0.4 + // cap contribution from huge candles
    gapBonus +
    closeBelowBonus

  return Math.min(confidence, 1) // cap at 1
}

export const isBullishExhaustion = (
  data: TickArray,
  index: number,
  requestParams: Partial<RequestParams>,
): boolean | null => {
  if (!requestParams.algoParams) return null
  const bullExhaustionRatioThreshold = +requestParams.algoParams.bullExhThreshold
  const candle = data[index]
  if (!candle) return null

  const body = Math.abs(candle.close - candle.open)
  const upperWick = candle.high - Math.max(candle.close, candle.open)
  const lowerWick = Math.min(candle.close, candle.open) - candle.low

  const isSmallBody = body < (candle.high - candle.low) * 0.4
  const isTopHeavy = upperWick / (lowerWick + 1e-6) > bullExhaustionRatioThreshold

  return isSmallBody && isTopHeavy
}
