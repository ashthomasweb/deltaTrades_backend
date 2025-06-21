import { Logger } from '../__core/logger'
import { RequestParams, TransactionPacket } from '../types/types'
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

export function algo1(requestParams: Partial<RequestParams>, passedData?: TransactionPacket) {
  /* Early returns */
  if (passedData === undefined) return
  if (requestParams.algoParams === undefined) return

  /* Runtime measurement and log */
  console.time('Algo runtime')
  Logger.info(
    'Packet retrieved and parsed!\n',
    passedData.tickerSymbol,
    passedData.queue.length > 0 ? `\nData present with ${passedData.queue.length - 1} entries` : '\nNo data present',
    '\n',
  )

  /* Param destructuring */
  const data = passedData.queue

  /* Output declarations */
  let singleDirectionBlocks = undefined
  let MA = undefined
  let crossingSignal = undefined
  let noiseWindows = undefined

  /* Single Direction Blocks */
  singleDirectionBlocks = detectSingleDirection(data, requestParams)

  /* Single Direction Block Volume Analysis */
  // const singleDirectionVolumeAnalysis = directionalBlockVolumeAnalysis(
  //   singleDirectionBlocks,
  //   dailyVolumeDistributionData,
  // )

  /* Secondary Data Generation */
  // These values will likely be stored in the DB at the end of each day
  const dayDataGroups: DailyDataGroups | undefined = groupByDays(data)
  const dailyDistributions = buildDailyDistributions(dayDataGroups)

  /* Moving Average */
  MA = calculateMA(data, requestParams)

  /* Create ExtendedTick Data */
  let extendedTickData
  if (MA) {
    extendedTickData = extendTickData(data, MA.data, dailyDistributions)
  }
  // Logger.toFileOut('extendedTickTesting/05-23.txt', 'Full Extended Results', extendedTickData.slice(-390), {
  //   overwrite: true,
  // })

  /* CrossingSignal (BuySignal) */
  // returns array of crossingSignals, and associated noiseWindows
  let confirmedCrossingDetectionOutput
  if (extendedTickData) {
    confirmedCrossingDetectionOutput = detectMAConfirmedCrossing(extendedTickData, requestParams)
    crossingSignal = confirmedCrossingDetectionOutput && confirmedCrossingDetectionOutput[0]
  }

  /* All Noise Windows In Dataset */
  if (extendedTickData) {
    noiseWindows = getAllNoiseWindows(extendedTickData, isNoisyWindow1, requestParams)
  }

  /* Completion of algorithm runtime measurement */
  console.timeEnd('Algo runtime')

  /* Output */
  return {
    singleDirBlocks: singleDirectionBlocks,
    MA: MA,
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

// const detectDirectionChange (usually consistent single direction followed by some fuzz)

// const detectFloor

// const detectCeiling

// const detectFloorCeilingMerge (often times indicates a correction - BIG MOVE)
