import { TickArray, ExtTick, Tick, RequestParams } from '../types/types'
import {
  findSingleTickBodyDistribution,
  findTickVolumeDistribution,
  getPreviousDayDistributions,
} from './distributions-ranges'
import { isCandleWickCrossingAvg, isCandleBodyCrossingAvg, findBodyCrossingPercent } from './entry-triggers'
import { isGreenCandle, isCandleFullByPercentage, getCandleBodyFullness } from './general-utilities'
import { calculateSMA, getPercentSlopeByPeriod } from './trend-analysis'

export const extendTickData = (
  data: TickArray,
  MaAvgArray: number[],
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
      value: [tick.timestamp, null],
      slope:
        index >= +requestParams.algoParams?.slopePeriod ? getPercentSlopeByPeriod(data, index, requestParams) : null,
    }

    const isBodyCrossing = isCandleBodyCrossingAvg(tick, MaAvgArray[index])
    if (isBodyCrossing) {
      result['isBodyCrossing'] = isBodyCrossing
      result['crossesBodyAtPercent'] = findBodyCrossingPercent(tick, MaAvgArray[index])
    }
    return result
  })
}
