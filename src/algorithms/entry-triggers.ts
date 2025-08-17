import { Tick, ExtTick } from '@/types'
import { isGreenCandle, isRedCandle } from './general-utilities'

export const findBodyCrossingPercent = (tick: Tick | ExtTick, avg: number) => {
  const amountBelowAvg = isGreenCandle(tick) ? avg - tick.open : avg - tick.close
  const tickBodyRange = Math.abs(tick.open - tick.close)
  const percentCrossedAt = (amountBelowAvg / tickBodyRange) * 100
  return percentCrossedAt
}

export const isCandleBodyCrossingAvg = (tick: Tick | ExtTick, avg: number) => {
  if (isGreenCandle(tick)) {
    return tick.open <= avg && tick.close >= avg
  } else if (isRedCandle(tick)) {
    return tick.open >= avg && tick.close <= avg
  }
}

export const isCandleWickCrossingAvg = (tick: Tick | ExtTick, avg: number) => {
  if (isGreenCandle(tick)) {
    return tick.low <= avg && tick.high >= avg
  } else if (isRedCandle(tick)) {
    return tick.high >= avg && tick.low <= avg
  }
}
