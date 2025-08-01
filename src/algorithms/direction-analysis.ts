/* Direction Utils */

import { Tick, ExtTick, TickArray, RequestParams } from '../types/types'
import { isGreenCandle, candlesMatch } from './general-utilities'

export const isDirectionTolerant = (
  data: Tick[] | ExtTick[],
  nextTick: Tick | ExtTick,
  tolerance: number,
  lastDirectionalIndex: number,
) => {
  const initialTick = data[0]
  const lastTick = data[lastDirectionalIndex]
  const opposingTickValue = isGreenCandle(initialTick) ? nextTick.low : nextTick.high
  const initialValue = isGreenCandle(initialTick) ? initialTick.low : initialTick.high
  const lastSingleDirectionValue = isGreenCandle(lastTick) ? lastTick.high : lastTick.low
  const totalPriceChange = lastSingleDirectionValue - initialValue
  const opposingChangeValue = opposingTickValue - lastSingleDirectionValue
  const opposingChangePercentage = Math.abs((opposingChangeValue / totalPriceChange) * 100)

  return opposingChangePercentage < tolerance * 100
}

export const detectSingleDirection = (data: TickArray, requestParams: Partial<RequestParams>) => {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...
  let result = []
  let directionArray = [data[0]]
  let lastDirectionalIndex = 0
  const minimumSequenceLength = +requestParams.algoParams.singleDirMin
  const tolerance = +requestParams.algoParams.oppThreshold

  for (const [index, tick] of Object.entries(data)) {
    if (candlesMatch(tick, directionArray[0])) {
      directionArray.push(tick)
      lastDirectionalIndex++
    } else if (
      tolerance &&
      directionArray.length >= minimumSequenceLength &&
      isDirectionTolerant(directionArray, tick, tolerance, lastDirectionalIndex)
    ) {
      directionArray.push(tick)
    } else {
      if (directionArray.length >= minimumSequenceLength) {
        result.push([...directionArray])
      }
      directionArray = []
      if (candlesMatch(data[+index - 1], tick)) {
        directionArray.push(data[+index - 1])
        directionArray.push(tick)
        lastDirectionalIndex = 1
      } else {
        lastDirectionalIndex = 0
        directionArray.push(tick)
      }
    }
  }

  const group: any = {}
  for (const array of result) {
    if (array[0].timestamp && group[array[0].timestamp] === undefined) {
      group[array[0].timestamp] = {
        start: array[0].timestamp,
        end: array[array.length - 1].timestamp,
        data: [...array],
      }
    }
  }

  return group
}
