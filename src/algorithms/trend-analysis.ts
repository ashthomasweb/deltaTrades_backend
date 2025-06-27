import { TickArray, RequestParams, Tick } from '../types/types'

type AvgType = 'default' | 'typicalPrice' | 'OHLCAverage'

const avgTypeFns = {
  default: (tick: Tick) => tick.close,
  typicalPrice: (tick: Tick) => (tick.high + tick.low + tick.close) / 3,
  OHLCAverage: (tick: Tick) => (tick.open + tick.high + tick.low + tick.close) / 4,
}

export const calculateSMA = (
  data: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined => {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const avgPeriod: number = +requestParams.algoParams.simpleAvgPeriod // TODO: rename param
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

export function calculateEMA(
  ticks: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const avgPeriod: number = +requestParams.algoParams.emaAvgPeriod
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

export function calculateSlope(
  ticks: TickArray,
  period: number,
): { data: (number | null)[]; type: string; smooth: boolean } {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const data: (number | null)[] = new Array(ticks.length).fill(null)

  for (let i = period; i < ticks.length; i++) {
    const prev = ticks[i - period].close
    const curr = ticks[i].close

    // Prevent divide-by-zero and meaningless comparison
    if (prev === 0 || isNaN(prev) || isNaN(curr)) {
      data[i] = null
      continue
    }

    // Percent slope over `period` bars
    const slope = (curr - prev) / prev
    data[i] = slope
  }

  return {
    data,
    type: 'line',
    smooth: true,
  }
}
