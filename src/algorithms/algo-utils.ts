/** ------------------------------------------------ /
 *  Utilities for algorithms!
 *  - All functions should be Pure Functions
 *  - All functions should return a value
/* ------------------------------------------------ */

import { request } from 'http'
import { Logger } from '../__core/logger'
import { ExtTick, RequestParams, Tick as Tick, TickArray } from '../types/types'
import { isNoisyWindow1, isNoisyWindow2, isNoisyWindow3, isNoisyWindow4 } from './noise-window-utils'

/* General Utils */

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

/* Time Utils */

export const isBefore945am = (tick: ExtTick) => {
  let result = false
  const invalidTimestamps = []
  for (let i = 30; i <= 44; i++) {
    invalidTimestamps.push(`09:${i.toString()}:00`)
  }

  for (const time of invalidTimestamps) {
    if (tick.timestamp?.includes(time)) {
      result = true
    }
  }
  return result
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

/* Direction Utils */

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

/* Volume Utils */

export const getVolumeRange = (data: TickArray) => {
  let high = data[0].volume
  let low = data[0].volume

  for (const tick of data) {
    if (tick.volume > high) {
      high = tick.volume
    }
    if (tick.volume < low) {
      low = tick.volume
    }
  }

  return { volHigh: high, volLow: low }
}

export const createVolumeDistributionMap = (data: TickArray) => {
  const volumeRange = getVolumeRange(data)

  const distributionBlock = (volumeRange.volHigh - volumeRange.volLow) / 100
  const distributionArray = new Array(101).fill(0)

  for (const tick of data) {
    const index = findTickVolumeDistribution(tick, volumeRange.volLow, distributionBlock)
    distributionArray[index]++
  }

  return {
    volHigh: volumeRange.volHigh,
    volLow: volumeRange.volLow,
    distributionBlock: distributionBlock,
    map: distributionArray,
  }
}

export const batchVolumeAnalysis = (inputArray: any[], volumeDistributionData: any) => {
  let result = []

  for (const tick of inputArray) {
    result.push({
      candleColor: isGreenCandle(tick) ? 'green' : 'red',
      timestamp: tick.timestamp,
      volDistribution: findTickVolumeDistribution(
        tick,
        volumeDistributionData.volLow,
        volumeDistributionData.distributionBlock,
      ),
    })
  }

  return result
}

// RETIRE? Same as batch?
export const directionalBlockVolumeAnalysis = (directionalArray: any[], volumeDistributionData: any) => {
  const result: any = []

  directionalArray.forEach((array) => {
    result.push(batchVolumeAnalysis(array, volumeDistributionData))
  })

  return result
}

export const findTickVolumeDistribution = (tick: Tick | ExtTick, low: number, distributionBlock: number) => {
  return Math.floor((tick.volume - low) / distributionBlock)
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

export const extendTickData = (data: TickArray, MaAvgArray: number[], dailyDistributions: any): ExtTick[] => {
  let currentDay = ''
  let previousDayDistributions: any = null

  return data.map((tick: Tick, index: number) => {
    if (tick.timestamp?.substring(0, 10) !== currentDay) {
      currentDay = tick.timestamp?.substring(0, 10)!
      previousDayDistributions = getPreviousDayDistributions(currentDay, dailyDistributions)
    }

    const result: ExtTick = {
      ...tick,
      originalIndex: index,
      isPrevGreen: index > 0 ? isGreenCandle(data[index - 1]) : null,
      isGreen: isGreenCandle(tick),
      isNextGreen: index < data.length - 1 ? isGreenCandle(data[index + 1]) : null,
      movingAvg: MaAvgArray[index],
      isWickCrossing: isCandleWickCrossingAvg(tick, MaAvgArray[index]),
      isBodyCrossing: false,
      crossesBodyAtPercent: null,
      isCandleFull80: isCandleFullByPercentage(tick, 0.8),
      candleBodyFullness: getCandleBodyFullness(tick),
      candleBodyDistPercentile: findSingleTickBodyDistribution(
        tick,
        previousDayDistributions.candleSize.body.range,
        previousDayDistributions.candleSize.body.distBlock,
      ),
      candleVolumeDistPercentile: findTickVolumeDistribution(
        tick,
        previousDayDistributions.volume.volLow,
        previousDayDistributions.volume.distributionBlock,
      ),
    }

    const isBodyCrossing = isCandleBodyCrossingAvg(tick, MaAvgArray[index])
    if (isBodyCrossing) {
      result['isBodyCrossing'] = isBodyCrossing
      result['crossesBodyAtPercent'] = findBodyCrossingPercent(tick, MaAvgArray[index])
    }
    return result
  })
}

/* Moving Average */

type AvgType = 'default' | 'typicalPrice' | 'OHLCAverage'

export const calculateMA = (
  data: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } => {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const numOfTicks = requestParams.algoParams.avgPeriod
  const avgType: AvgType = requestParams.algoParams.maAvgType

  const avgTypeFns = {
    default: (tick: Tick) => tick.close,
    typicalPrice: (tick: Tick) => (tick.high + tick.low + tick.close) / 3,
    OHLCAverage: (tick: Tick) => (tick.open + tick.high + tick.low + tick.close) / 4,
  }

  const analysisPacket = {
    data: new Array(data.length).fill(null),
    type: 'line',
    smooth: true,
  }

  for (let i = numOfTicks - 1; i < data.length; i++) {
    const window = data.slice(i - numOfTicks + 1, i + 1)
    const sum = window.reduce((acc, tick) => acc + avgTypeFns[avgType](tick), 0)
    analysisPacket.data[i] = sum / numOfTicks
  }

  return analysisPacket
}

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

/* Candle Size Distributions */

const findSingleTickWickDistribution = (tick: Tick | ExtTick, range: any, distributionBlock: number) => {
  return Math.floor(((tick.high - tick.low - range.low) * 1000) / (distributionBlock * 1000))
}

const findSingleTickBodyDistribution = (tick: Tick | ExtTick, range: any, distributionBlock: number) => {
  return Math.floor(((Math.abs(tick.open - tick.close) - range.low) * 1000) / (distributionBlock * 1000))
}

export const getCandleSizeRange = (data: TickArray) => {
  const wickRange = {
    high: 0,
    low: Infinity,
  }
  const bodyRange = {
    high: 0,
    low: Infinity,
  }

  for (const tick of data) {
    if (tick.high - tick.low > wickRange.high) {
      wickRange.high = tick.high - tick.low
    }
    if (tick.high - tick.low < wickRange.low) {
      wickRange.low = tick.high - tick.low
    }

    if (Math.abs(tick.open - tick.close) > bodyRange.high) {
      bodyRange.high = Math.abs(tick.open - tick.close)
    }
    if (Math.abs(tick.open - tick.close) < bodyRange.low) {
      bodyRange.low = Math.abs(tick.open - tick.close)
    }
  }

  return [wickRange, bodyRange]
}

export const createCandleSizeDistributionMaps = (data: TickArray) => {
  const [wickRange, bodyRange] = getCandleSizeRange(data)

  const wickDistributionBlock = (wickRange.high - wickRange.low) / 100
  const wickDistributionArray = new Array(101).fill(0)
  const bodyDistributionBlock = (bodyRange.high - bodyRange.low) / 100
  const bodyDistributionArray = new Array(101).fill(0)

  for (const tick of data) {
    const wickIndex = findSingleTickWickDistribution(tick, wickRange, wickDistributionBlock)
    wickDistributionArray[wickIndex]++

    const bodyIndex = findSingleTickBodyDistribution(tick, bodyRange, bodyDistributionBlock)
    bodyDistributionArray[bodyIndex]++
  }

  return {
    wick: {
      range: wickRange,
      distBlock: wickDistributionBlock,
      map: wickDistributionArray,
    },
    body: {
      range: bodyRange,
      distBlock: bodyDistributionBlock,
      map: bodyDistributionArray,
    },
  }
}

/* FilterBy Utils */

// const filterByDoubleBars = (data: Tick[], tolerance: number) => {
//   data.filter((tick: Tick) => {
//     for (let i = 0; i < data.length; i++) {
//       const tick = data[i]
//       if (i < 0) {
//         const previousTick = data[i - 1]
//         const tickBodyValue = Math.abs(tick.open - tick.close)
//         const previousTickBodyValue = Math.abs(tick.open - tick.close)
//       }
//     }
//   })
// }

// const filterOutAverageNoise = (data: Tick[], avgArray: number[]) => {
//   const result: Tick[] = []
//   let windowArray: Tick[] = []
//   for (let i = 10; i < data.length; i++) {
//     windowArray = data.slice(i - 10, i)

//     for (let j = 0; j < windowArray.length; j++) {
//       if (isGreenCandle(windowArray[j]) && )
//     }

//   }
// }

const filterByConfirmed = (fullData: ExtTick[], filteredData: ExtTick[]) => {
  let result = []
  for (let i = 0; i < filteredData.length; i++) {
    if (filteredData[i].isGreen === filteredData[i].isNextGreen) {
      result.push(fullData[filteredData[i].originalIndex! + 1])
    }
  }
  return result
}

const filterByCandleDistribution = (data: TickArray, lowerThreshold: number) => {
  let result = []
  const candleSizeDistributionMap = createCandleSizeDistributionMaps(data)
  for (const tick of data) {
    if (
      findSingleTickBodyDistribution(
        tick,
        candleSizeDistributionMap.body.range,
        candleSizeDistributionMap.body.distBlock,
      ) > lowerThreshold
    ) {
      result.push(tick)
    }
  }
  return result
}

/* Multi-metric Utils */

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
  }

  for (let i = 0; i < data.length - 1; i++) {
    const tick = data[i]
    if (tick.isBodyCrossing && tick.candleBodyDistPercentile! > +algoParams.minCandleBodyDist && !isBefore945am(tick)) {
      windowArray = data.slice(i - +algoParams.noiseWindowLength, i - 1)
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

export type DailyDataGroups = Record<string, Tick[]>

export const buildDailyDistributions = (dailyDataGroups: DailyDataGroups | undefined) => {
  let result: Record<string, any> = {}

  for (const day in dailyDataGroups) {
    result[day] = {
      volume: createVolumeDistributionMap(dailyDataGroups[day]),
      candleSize: createCandleSizeDistributionMaps(dailyDataGroups[day]),
    }
  }

  return result
}

// Will need adaptation for realTime
const getPreviousDayDistributions = (currentDay: string, dailyDistributions: any) => {
  return dailyDistributions[currentDay]
}

/* FOR RETIRE? */

/*
 const checkForNoise = (tick: ExtTick, index: number) => {
    windowArray = data.slice(index - 6, index - 1)
    count = 0
    windowArray.forEach((entry) => entry.isWickCrossing && count++)
    if (count < 2) {
      result.push(tick)
    }
  }

  const checkForNoise = (tick: ExtTick, index: number) => {
    windowArray = data.slice(index - 10, index - 1)
    count = 0
    windowArray.forEach((entry) => (entry.candleBodyFullness < 40 || entry.isWickCrossing) && count++)
    if (count < 5) {
      result.push(tick)
    }
  }

*/
