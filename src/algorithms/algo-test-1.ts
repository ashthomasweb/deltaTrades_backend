import { Logger } from '../__core/logger'
import {
  daySelector,
  detectFullCandles,
  createVolumeDistributionMap,
  directionalBlockVolumeAnalysis,
  detectSingleDirection,
  getVolumeRange,
  batchVolumeAnalysis,
  calculateMA,
  detectMAConfirmedCrossing,
  createCandleSizeDistributionMaps,
  extendTickData,
  groupByDays,
  buildDailyDistributions,
  DailyDataGroups,
} from './algo-utils'

import {
  getAllNoiseWindows,
  isNoisyWindow1,
  isNoisyWindow2,
  isNoisyWindow3,
  isNoisyWindow4,
} from './noise-window-utils'

export function algo1(requestParams: any, passedData?: any) {
  console.log('TRACE: algo1', requestParams)
  console.time('algo1')

  const data = passedData.queue
  Logger.info(
    'Packet retrieved and parsed!\n',
    passedData.tickerSymbol,
    data.length > 0 ? `\nData present with ${data.length - 1} entries` : '\nNo data present',
    '\n',
  )

  const singleDirectionBlocks = detectSingleDirection(
    data,
    +requestParams.algoParams.singleDirMin,
    +requestParams.algoParams.oppThreshold,
  )

  // const singleDirectionVolumeAnalysis = directionalBlockVolumeAnalysis(
  //   singleDirectionBlocks,
  //   dailyVolumeDistributionData,
  // )

  /* This will be stored in the DB at the end of each day */
  const dayDataGroups: DailyDataGroups | undefined = groupByDays(data)
  const dailyDistributions = buildDailyDistributions(dayDataGroups)
  /* END */

  const MA = calculateMA(data, 7, { avgType: 'default' })

  const extendedTickData = extendTickData(data, MA.data, dailyDistributions)
  Logger.toFileOut('extendedTickTesting/05-23.txt', 'Full Extended Results', extendedTickData.slice(-390), {
    overwrite: true,
  })

  const [crossingSignal, noiseWindowsPerSignal] = detectMAConfirmedCrossing(extendedTickData)

  const noiseWindows = getAllNoiseWindows(extendedTickData, isNoisyWindow1)

  console.timeEnd('algo1')
  return {
    singleDirBlocks: singleDirectionBlocks,
    MA10: MA,
    crossingSignal: crossingSignal,
    noiseWindows: noiseWindows,
  }
}

/* There seems to be a pattern (still unidentified) surrounding the following times/conditions */
// const getPreviousClose

// const previousNightBehavior

// const openingBehavior

// const 945amBehavior

// const 10amBehavior
/* END */

// const findIncreasingVolume

// const detectFuzz (Decent indicator of directional change. Defined as sequential candlesticks
// inluding some of the following: No clear direction - long wicks & short candles - alternating
// colors - usually for 3-5 minutes)

// const detectDirectionChange (usually consistent single direction followed by some fuzz)

// const detectFloor

// const detectCeiling

// const detectFloorCeilingMerge (often times indicates a correction - BIG MOVE)
