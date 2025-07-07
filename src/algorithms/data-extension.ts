import { TickArray, ExtTick, Tick, RequestParams } from '../types/types'
import {
  findSingleTickBodyDistribution,
  findTickVolumeDistribution,
  getPreviousDayDistributions,
} from './distributions-ranges'
import { isCandleWickCrossingAvg, isCandleBodyCrossingAvg, findBodyCrossingPercent } from './entry-triggers'
import { isGreenCandle, isCandleFullByPercentage, getCandleBodyFullness } from './general-utilities'
import {
  bollingerBreakout,
  getBearishEngulfingScore,
  getPercentSlopeByPeriod,
  getPriceSlopeByPeriod,
  isBullishExhaustion,
  MACrossover,
} from './trend-analysis'
import { calculateVolumeTrend, calculateVolumeTrendScore } from './volume-utils'

export const extendTickData = (
  data: TickArray,
  maAvgArrayShort: number[],
  emaAvgArrayShort: number[],
  emaAvgArrayLong: number[],
  bollingerSeries: any,
  dailyDistributions: any,
  requestParams: Partial<RequestParams>,
): ExtTick[] => {
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
      movingAvg: maAvgArrayShort[index],
      shortEmaAvg: emaAvgArrayShort[index],
      longEmaAvg: emaAvgArrayLong[index],
      emaCrossing: MACrossover(emaAvgArrayShort, emaAvgArrayLong, index),
      bollingerBreakout: bollingerBreakout(tick, bollingerSeries, index),
      bearishEngulfingScore: getBearishEngulfingScore(data, index, requestParams),
      isBullishExhaustion: isBullishExhaustion(data, index, requestParams),
      isWickCrossing: isCandleWickCrossingAvg(tick, maAvgArrayShort[index]),
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
      volumeTrendIncreasing: calculateVolumeTrendScore(data, index, requestParams),
      value: [tick.timestamp, null], // WHAT IS THIS? I think it's for a hidden display point? Verify or Retire.
      percSlopeByPeriod:
        index >= +requestParams.algoParams?.slopePeriodRawPrice
          ? getPercentSlopeByPeriod(data, index, requestParams, 'close')
          : null,
      priceSlopeByPeriod:
        index >= +requestParams.algoParams?.slopePeriodRawPrice
          ? getPriceSlopeByPeriod(data, index, requestParams)
          : null,
      smaSlopeByPeriod:
        index >= +requestParams.algoParams?.slopePeriodSMA
          ? getPercentSlopeByPeriod(maAvgArrayShort, index, requestParams, 'sma')
          : null,
      emaSlopeByPeriod:
        index >= +requestParams.algoParams?.slopePeriodEMA
          ? getPercentSlopeByPeriod(emaAvgArrayShort, index, requestParams, 'ema')
          : null,
    }

    const isBodyCrossing = isCandleBodyCrossingAvg(tick, maAvgArrayShort[index])
    if (isBodyCrossing) {
      result['isBodyCrossing'] = isBodyCrossing
      result['crossesBodyAtPercent'] = findBodyCrossingPercent(tick, maAvgArrayShort[index])
    }
    return result
  })
}
