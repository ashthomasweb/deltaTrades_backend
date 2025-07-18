/* Bollinger Bands */

import { RequestParams, Tick, TickArray } from '@/types'

type BollingerBand = {
  upper: number | null
  middle: number | null
  lower: number | null
}

function calculateBollingerBands(data: Tick[], period: number = 20, multiplier: number = 2): BollingerBand[] {
  const result: BollingerBand[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ upper: null, middle: null, lower: null })
      continue
    }

    const slice = data.slice(i - period + 1, i + 1)
    const closes = slice.map((d) => d.close)

    const mean = closes.reduce((sum, val) => sum + val, 0) / period
    const variance = closes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    const stdDev = Math.sqrt(variance)

    result.push({
      upper: mean + multiplier * stdDev,
      middle: mean,
      lower: mean - multiplier * stdDev,
    })
  }

  return result
}

export function generateBollingerSeries(ticks: Tick[], period: number = 20, multiplier: number = 2): any[] {
  const bands = calculateBollingerBands(ticks, period, multiplier)

  const upperBand = bands.map((b, i) => b.upper)
  const middleBand = bands.map((b, i) => b.middle)
  const lowerBand = bands.map((b, i) => b.lower)

  const style = {
    showSymbol: false,
    type: 'line' as const,
  }

  return [
    {
      ...style,
      name: 'Bollinger Band',
      data: upperBand,
      lineStyle: { type: 'dashed', color: '#888' },
    },
    {
      ...style,
      name: 'Bollinger Band',
      data: middleBand,
      lineStyle: { color: '#555' },
    },
    {
      ...style,
      name: 'Bollinger Band',
      data: lowerBand,
      lineStyle: { type: 'dashed', color: '#888' },
    },
  ]
}

export function calculateRSI(data: TickArray, requestParams: Partial<RequestParams>): (number | null)[] | undefined {
  if (!requestParams.algoParams) return undefined
  const period = +requestParams.algoParams.rsiPeriod
  const rsi: (number | null)[] = new Array(data.length).fill(null)

  let gains = 0
  let losses = 0

  // First average gain/loss
  for (let i = 1; i <= period; i++) {
    const delta = data[i].close - data[i - 1].close
    if (delta >= 0) {
      gains += delta
    } else {
      losses -= delta // subtracting negative value to get positive loss
    }
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // Smooth RSI calculation
  for (let i = period + 1; i < data.length; i++) {
    const delta = data[i].close - data[i - 1].close
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? -delta : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return rsi
}
