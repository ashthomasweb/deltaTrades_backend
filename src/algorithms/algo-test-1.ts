import fs from 'fs'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
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

// TODO: Create a sliding window. Analyzing across a whole day doesn't do any good except for checking
// that functions detect conditions correctly.

const usePassedData = true

export function algo1(passedData?: any) {
  console.log('TRACE: algo1')
  console.time('algo1')

  let data
  let packet
  if (usePassedData) {
    data = passedData.queue
    Logger.info(
      'Packet retrieved and parsed!\n',
      passedData.tickerSymbol,
      data.length > 0 ? `\nData present with ${data.length - 1} entries` : '\nNo data present',
      '\n',
    )
  } else {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const FILE_PATH = path.resolve(__dirname, `../storedData/TSLA-1min-2025-04-full.json`)
    const raw = fs.readFileSync(FILE_PATH, 'utf8')
    packet = JSON.parse(raw)
    data = packet.data
    Logger.info(
      'Packet retrieved and parsed!\n',
      packet.id,
      packet.creationMeta,
      packet.metaData,
      data.length > 0 ? `\nData present with ${data.length - 1} entries` : '\nNo data present',
      '\n',
    )
  }

  // const day = daySelector(data, 30)

  const singleDirectionBlocks = detectSingleDirection(data, 4, 0.18)
  // console.log(singleDirectionBlocks)

  // const singleDirectionVolumeAnalysis = directionalBlockVolumeAnalysis(
  //   singleDirectionBlocks,
  //   dailyVolumeDistributionData,
  // )
  // console.log(singleDirectionVolumeAnalysis)

  /* This will be stored in the DB at the end of each day */
  const dayDataGroups: DailyDataGroups | undefined = groupByDays(data)
  const dailyDistributions = buildDailyDistributions(dayDataGroups)
  // console.log(dailyDistributions['2025-04-01'].volume, dailyDistributions['2025-04-01'].candleSize)
  /* END */

  const MA = calculateMA(data, 7, { avgType: 'default' })

  const extendedTickData = extendTickData(data, MA.data, dailyDistributions)
  Logger.toFileOut('extendedTickTesting/05-23.txt', 'Full Extended Results', extendedTickData.slice(-390), {
    overwrite: true,
  })

  // const [crossingSignal, noiseWindows] = detectMAConfirmedCrossing(extendedTickData)
  // Logger.toFileOut('noiseWindowTesting/05-25.txt', 'All Noise Window Matchers', noiseWindows, { overwrite: true })

  const noiseWindows = getAllNoiseWindows(extendedTickData, isNoisyWindow3)

  console.timeEnd('algo1')
  return {
    singleDirBlocks: singleDirectionBlocks,
    MA10: MA,
    // crossingSignal: crossingSignal,
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
