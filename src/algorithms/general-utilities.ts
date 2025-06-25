/* General Utils */

import { TickArray, Tick, ExtTick } from '../types/types'

// Finds a single day
// NOTE: If the day passed is a non-market-day (weekend/holiday), no results will be returned!
export const daySelector = (data: TickArray, day: number) => {
  let result = []

  for (const tick of data) {
    if (parseFloat(tick.timestamp!.substring(8, 10)) === day) {
      result.push(tick)
    }
  }

  if (result.length === 0) {
    throw new Error('No matching timestamps. Is request a trading day?')
  }

  return result
}

export const groupByDays = (data: TickArray) => {
  const dataByDays: Record<string, Tick[]> = {}
  for (const tick of data) {
    if (tick.timestamp === undefined) return
    if (dataByDays[tick.timestamp.substring(0, 10)] === undefined) {
      dataByDays[tick.timestamp.substring(0, 10)] = [tick]
    } else {
      dataByDays[tick.timestamp.substring(0, 10)].push(tick)
    }
  }
  return dataByDays
}

/* Candlestick Analysis Utils */

export const isGreenCandle = (tick: Tick | ExtTick) => tick.open < tick.close

export const isRedCandle = (tick: Tick | ExtTick) => tick.open > tick.close

export const candlesMatch = (tick1: Tick | ExtTick, tick2: Tick | ExtTick) =>
  isGreenCandle(tick1) === isGreenCandle(tick2)

export const isCandleFullByPercentage = (tick: Tick | ExtTick, bodyPercentage: number) => {
  const bodyValue = Math.abs(tick.open - tick.close)
  const wickValue = tick.high - tick.low
  return bodyValue >= wickValue * bodyPercentage
}

export const getCandleBodyFullness = (tick: Tick | ExtTick) => {
  const bodyValue = Math.abs(tick.open - tick.close)
  const wickValue = tick.high - tick.low
  return (bodyValue / wickValue) * 100
}

/* Tolerance Utils */

export const isWithinToleranceAbs = (number1: number, number2: number, tolerance: number) => {
  const difference = Math.abs(number1 - number2)
  return difference <= tolerance
}

export const isWithinTolerancePercent = (number1: number, number2: number, tolerance: number) => {
  const difference = Math.abs(number1 - number2)
  let toleranceAbsValue: number = 0
  if (number1 > number2) {
    toleranceAbsValue = number1 * tolerance
  } else {
    toleranceAbsValue = number2 * tolerance
  }
  return difference <= toleranceAbsValue
}
