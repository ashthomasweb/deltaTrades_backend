import { Logger } from '../__core/logger'
import { RequestParams, TransactionPacket } from '@/types'
import { extendTickData } from './data-extension'
import { detectSingleDirection } from './direction-analysis'
import {
  DailyDataGroups,
  buildDailyDistributions,
} from './distributions-ranges'
import { groupByDays } from './general-utilities'
import { getAllNoiseWindows } from './noise-windows'
import { detectMAConfirmedCrossing } from './signal-algos/trend-following'
import {
  calculateADX,
  calculateEMA1,
  calculateEMA2,
  calculateMACD,
  calculateSMA1,
} from './trend-analysis'
import { calculateRSI, generateBollingerSeries } from './volatility-analysis'

export function algoOutput(
  requestParams: Partial<RequestParams>,
  passedData?: TransactionPacket,
) {
  /* Early returns */
  if (passedData === undefined) return
  if (requestParams.algoParams === undefined) return

  /* Runtime measurement and log */
  console.time('Algo runtime')
  Logger.info(
    'Packet retrieved and parsed!\n',
    passedData.tickerSymbol,
    passedData.queue.length > 0
      ? `\nData present with ${passedData.queue.length - 1} entries`
      : '\nNo data present',
    '\n',
  )

  /* Param destructuring */
  const data = passedData.queue

  /* Output declarations */
  let singleDirectionBlocks = undefined
  let SMA1 = undefined
  let EMA1 = undefined
  let EMA2 = undefined
  let ADX = undefined
  let crossingSignal = undefined
  let noiseWindows = undefined
  let bollingerBands = undefined
  let RSI = undefined
  let MACD = undefined

  /* Single Direction Blocks */
  singleDirectionBlocks = detectSingleDirection(data, requestParams)

  /* Secondary Data Generation */
  // These values will likely be stored in the DB at the end of each day
  const dayDataGroups: DailyDataGroups | undefined = groupByDays(data)
  const dailyDistributions = buildDailyDistributions(dayDataGroups)

  /* Moving Average */
  SMA1 = calculateSMA1(data, requestParams)
  EMA1 = calculateEMA1(data, requestParams)
  EMA2 = calculateEMA2(data, requestParams)

  /* Average Directional Index */
  ADX = calculateADX(data, requestParams)

  /* RSI (Relative Strength Index) */
  RSI = calculateRSI(data, requestParams)

  /* Bollinger Bands */
  bollingerBands = generateBollingerSeries(data, 20, 2)

  /* MACD */
  MACD = calculateMACD(data, requestParams)

  /* Create ExtendedTick Data */
  let extendedTickData
  if (SMA1 && EMA1 && EMA2) {
    extendedTickData = extendTickData(
      data,
      SMA1.data,
      EMA1.data,
      EMA2.data,
      bollingerBands,
      dailyDistributions,
      requestParams,
    )
  }

  /* CrossingSignal (BuySignal) */
  // returns array of crossingSignals, and associated noiseWindows
  let confirmedCrossingDetectionOutput
  if (extendedTickData) {
    confirmedCrossingDetectionOutput = detectMAConfirmedCrossing(
      extendedTickData,
      requestParams,
    )
    crossingSignal =
      confirmedCrossingDetectionOutput && confirmedCrossingDetectionOutput[0]
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
      SMA1: SMA1,
      EMA1: EMA1,
      EMA2: EMA2,
      ADX: ADX,
      RSI: RSI,
      MACD: MACD,
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
