import { Logger } from '../__core/logger'
import { RequestParams, TransactionPacket } from '../types/types'
import { extendTickData } from './data-extension'
import { detectSingleDirection } from './direction-analysis'
import { DailyDataGroups, buildDailyDistributions } from './distributions-ranges'
import { groupByDays } from './general-utilities'
import { getAllNoiseWindows } from './noise-windows'
import { detectMAConfirmedCrossing } from './signal-algos/trend-following'
import { calculateEMA, calculateSMA } from './trend-analysis'
import { generateBollingerSeries } from './volatility-analysis'

export function algoOutput(requestParams: Partial<RequestParams>, passedData?: TransactionPacket) {
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
  let SMA = undefined
  let EMA = undefined
  let crossingSignal = undefined
  let noiseWindows = undefined
  let bollingerBands = undefined

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
  SMA = calculateSMA(data, requestParams)
  EMA = calculateEMA(data, requestParams)

  /* Bollinger Bands */
  bollingerBands = generateBollingerSeries(data, 20, 2)

  /* Create ExtendedTick Data */
  let extendedTickData
  if (SMA && EMA) {
    extendedTickData = extendTickData(data, SMA.data, EMA.data, dailyDistributions, requestParams)
  }

  /* CrossingSignal (BuySignal) */
  // returns array of crossingSignals, and associated noiseWindows
  let confirmedCrossingDetectionOutput
  if (extendedTickData) {
    confirmedCrossingDetectionOutput = detectMAConfirmedCrossing(extendedTickData, requestParams)
    crossingSignal = confirmedCrossingDetectionOutput && confirmedCrossingDetectionOutput[0]
  }

  /* All Noise Windows In Dataset */
  if (extendedTickData) {
    noiseWindows = getAllNoiseWindows(extendedTickData, requestParams)
  }

  /* Completion of algorithm runtime measurement */
  console.timeEnd('Algo runtime')

  /* Output */
  return {
    analysis: {
      singleDirBlocks: singleDirectionBlocks,
      MA: SMA,
      EMA: EMA,
      crossingSignal: crossingSignal,
      noiseWindows: noiseWindows,
      bollingerBands,
    },
    extTickData: extendedTickData,
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
