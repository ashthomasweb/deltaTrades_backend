/* Bollinger Bands */

import { Tick } from '../types/types'

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
