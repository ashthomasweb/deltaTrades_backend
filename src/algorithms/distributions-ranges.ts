/* Candle Size Distributions */

import { Tick, ExtTick, TickArray } from '@/types'

export const findSingleTickWickDistribution = (tick: Tick | ExtTick, range: any, distributionBlock: number) => {
  return Math.floor(((tick.high - tick.low - range.low) * 1000) / (distributionBlock * 1000))
}

export const findSingleTickBodyDistribution = (tick: Tick | ExtTick, range: any, distributionBlock: number) => {
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
export const getPreviousDayDistributions = (currentDay: string, dailyDistributions: any) => {
  return dailyDistributions[currentDay] // TODO: Get Previous... returns current?? 
}

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

export const findTickVolumeDistribution = (tick: Tick | ExtTick, low: number, distributionBlock: number) => {
  return Math.floor((tick.volume - low) / distributionBlock)
}
