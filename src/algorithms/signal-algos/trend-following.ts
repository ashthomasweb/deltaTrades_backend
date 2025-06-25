/* Multi-metric Utils */

import { ExtTick, RequestParams } from '../../types/types'
import { filterByConfirmed } from '../general-filters'
import {
  isNoisyWindow1,
  isNoisyWindow2,
  isNoisyWindow3,
  isNoisyWindow4,
  isNoisyWindow5,
  isNoisyWindow6,
} from '../noise-windows'
import { isBefore945am } from '../time-filters'

export const detectMAConfirmedCrossing = (
  data: ExtTick[],
  requestParams: Partial<RequestParams>,
): (string | undefined)[] | undefined => {
  console.log(requestParams)
  if (!requestParams.algoParams) return
  const algoParams = requestParams.algoParams
  let result: any = []
  let windowArray = []
  let noiseWindows = []
  const noiseWindowKey: string = algoParams.noiseWindow
  const noiseFunction: Record<string, Function> = {
    NW1: isNoisyWindow1,
    NW2: isNoisyWindow2,
    NW3: isNoisyWindow3,
    NW4: isNoisyWindow4,
    NW5: isNoisyWindow5,
    NW6: isNoisyWindow6,
  }

  for (let i = 0; i < data.length - 1; i++) {
    const tick = data[i]
    if (tick.isBodyCrossing && tick.candleBodyDistPercentile! > +algoParams.minCandleBodyDist && !isBefore945am(tick)) {
      windowArray = data.slice(i - (+algoParams.noiseWindowLength + 1), i - 1)
      const options = {
        atrMultiplier: +algoParams.atrMultiplier,
        alternationThreshold: +algoParams.altThreshold,
        huggingRatio: +algoParams.hugRatio, // Accepts range of [0 - 1]. Lower values result in more noise windows
      }
      if (noiseFunction[noiseWindowKey](windowArray, options)) {
        noiseWindows.push(windowArray)
      } else {
        result.push(tick)
      }
    }
  }

  console.log(result.length)

  // Array of noise windows that caused a crossing signal to be marked as 'non-starter'
  const negatingWindows: any = {}
  for (const array of noiseWindows) {
    if (negatingWindows[array[0].timestamp!] === undefined) {
      negatingWindows[array[0].timestamp!] = {
        start: array[0].timestamp,
        end: array[array.length - 1].timestamp,
        data: [...array],
      }
    }
  }

  // refine by percentage of candle crossed ?? Maybe not...

  // refine by full candles
  // result = filterByCandleFullness(result, 0.6)

  // refine by bounce

  // refine by volume

  // refine by double bars (similar size and placement of opposing green/red in sequence)
  // result = filterByDoubleBars(result, tolerance)

  // refine by averageHugging

  // ATTN: At this time, this function must be the last filter run in the algo
  // refine by confirmed candles
  result = filterByConfirmed(data, result)

  return [result.map((entry: ExtTick) => entry.timestamp), negatingWindows]
}
