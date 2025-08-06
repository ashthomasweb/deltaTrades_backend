import { TickArray, ExtTick, Tick, RequestParams } from '@/types'
import {
  findSingleTickBodyDistribution,
  findTickVolumeDistribution,
  getPreviousDayDistributions,
} from './distributions-ranges'
import { isCandleWickCrossingAvg, isCandleBodyCrossingAvg, findBodyCrossingPercent } from './entry-triggers'
import {
  isGreenCandle,
  isCandleFullByPercentage,
  getCandleBodyFullness,
  findAbsoluteChange,
  findPercentChange,
} from './general-utilities'
import {
  bollingerBreakout,
  getBearishEngulfingScore,
  getPercentSlopeByPeriod,
  getPriceSlopeByPeriod,
  isBullishExhaustion,
  MACrossover,
} from './trend-analysis'
import { calculateVolumeTrend, calculateVolumeTrendScore, calculateVWAP } from './volume-utils'

export const extendTickData = (
  data: TickArray,
  maAvgArrayShort: number[],
  emaAvgArrayShort: number[],
  emaAvgArrayLong: number[],
  bollingerSeries: any,
  dailyDistributions: any,
  requestParams: Partial<RequestParams>,
): ExtTick[] | null => {
  const { algoParams } = requestParams
  if (
    !data.length ||
    !algoParams ||
    typeof algoParams.slopePeriodByRawPrice !== 'number' ||
    typeof algoParams.slopePeriodByEMA !== 'number' ||
    typeof algoParams.slopePeriodBySMA !== 'number'
  ) return null

  let currentDay = ''
  let previousDayDistributions: any = null

  return data.map((tick: Tick, index: number) => {
    if (tick.timestamp?.substring(0, 10) !== currentDay) {
      currentDay = tick.timestamp?.substring(0, 10)!
      previousDayDistributions = getPreviousDayDistributions(currentDay, dailyDistributions)
    }

    const isBodyCrossing = isCandleBodyCrossingAvg(tick, maAvgArrayShort[index])

    const result: ExtTick = {
      ...tick,
      originalIndex: index,
      isPrevGreen: index > 0 ? isGreenCandle(data[index - 1]) : null,
      isGreen: isGreenCandle(tick),
      isNextGreen: index < data.length - 1 ? isGreenCandle(data[index + 1]) : null,
      percentChange: index > 0 ? findPercentChange(data[index].close, data[index - 1].close) : null,
      absoluteChange: index > 0 ? findAbsoluteChange(data[index].close, data[index - 1].close) : null,
      movingAvg: maAvgArrayShort[index],
      shortEmaAvg: emaAvgArrayShort[index],
      longEmaAvg: emaAvgArrayLong[index],
      emaCrossing: MACrossover(emaAvgArrayShort, emaAvgArrayLong, index),
      bollingerBreakout: bollingerBreakout(tick, bollingerSeries, index),
      bearishEngulfingScore: getBearishEngulfingScore(data, index, requestParams),
      isBullishExhaustion: isBullishExhaustion(data, index, requestParams),
      isWickCrossing: isCandleWickCrossingAvg(tick, maAvgArrayShort[index]),
      isBodyCrossing: isBodyCrossing,
      crossesBodyAtPercent: isBodyCrossing ? findBodyCrossingPercent(tick, maAvgArrayShort[index]) : null,
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
        index >= algoParams?.slopePeriodByRawPrice
          ? getPercentSlopeByPeriod(data, index, requestParams, 'close')
          : null,
      priceSlopeByPeriod:
        index >= algoParams?.slopePeriodByRawPrice
          ? getPriceSlopeByPeriod(data, index, requestParams)
          : null,
      smaSlopeByPeriod:
        index >= algoParams?.slopePeriodBySMA
          ? getPercentSlopeByPeriod(maAvgArrayShort, index, requestParams, 'sma')
          : null,
      emaSlopeByPeriod:
        index >= algoParams?.slopePeriodByEMA
          ? getPercentSlopeByPeriod(emaAvgArrayShort, index, requestParams, 'ema')
          : null,
      vwap: calculateVWAP(data, index) // TODO: what window should this be calculated by? Intraday only?
    }

    return result
  })
}
