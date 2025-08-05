/* Volume Utils */

import { RequestParams, TickArray } from '@/types'
import { findTickVolumeDistribution } from './distributions-ranges'
import { isGreenCandle } from './general-utilities'

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

export const calculateVWAP = (data: TickArray, index: number) => {
  let accumulatedPV: number = 0
  let accumulatedVolume: number = 0

  for (let i = 0; i <= index; i++) {
    accumulatedVolume = accumulatedVolume + data[i].volume
    accumulatedPV = accumulatedPV + ((data[i].high + data[i].low + data[i].close) / 3) * data[i].volume
  }

  return accumulatedVolume === 0 ? 0 : accumulatedPV / accumulatedVolume
}

// export const calculateVolumeStepTrend = (
//   tickArray: TickArray,
//   index: number,
//   requestParams: Partial<RequestParams>,
// ): boolean | null => {
//   const { algoParams } = requestParams
//   if (
//     !tickArray.length ||
//     !algoParams ||
//     typeof algoParams.volumeTrendLookback !== 'number' ||
//     // typeof algoParams.volumeTrendMinGrowthSteps !== 'number'
//   ) return null

//   const lookback = algoParams.volumeTrendLookback
//   const minGrowthSteps = algoParams.volumeTrendMinGrowthSteps // TODO: Pass from FE if used

//   if (index < lookback) return null

//   let upCount = 0

//   for (let j = index - lookback + 1; j <= index; j++) {
//     if (tickArray[j].volume > tickArray[j - 1].volume) {
//       upCount++
//     }
//   }

//   return upCount >= minGrowthSteps
// }

// export const calculateVolumeTrendScore = (
//   data: TickArray,
//   index: number,
//   requestParams: Partial<RequestParams>,
// ): number | null => {
//   if (!requestParams.algoParams) return null
//   const lookback = +requestParams.algoParams.volumeTrendLookback
//   const maxDropPercentage = +requestParams.algoParams.volumeTrendMaxDrop
//   if (index < lookback) return null

//   let upSteps = 0
//   let maxDrop = 0

//   for (let j = index - lookback + 1; j <= index; j++) {
//     const prev = data[j - 1].volume
//     const curr = data[j].volume

//     if (curr > prev) {
//       upSteps++
//     } else {
//       const drop = (prev - curr) / prev
//       if (drop > maxDrop) maxDrop = drop
//     }
//   }

//   const upScore = upSteps / lookback
//   const dropPenalty = Math.min(maxDrop / maxDropPercentage, 1) // cap at 1

//   const score = upScore * (1 - dropPenalty)
//   return score
// }

// export const calculateVolumeTrendScore = (
//   data: TickArray,
//   index: number,
//   requestParams: Partial<RequestParams>,
// ): number | null => {
//   if (!requestParams.algoParams) return null
//   const lookback = +requestParams.algoParams.volumeTrendLookback
//   const maxAllowedMedianDrop = +requestParams.algoParams.volumeTrendMaxDrop
//   if (index < lookback) return null

//   const slice = data.slice(index - lookback + 1, index + 1)
//   const volumes = slice.map((d) => d.volume).sort((a, b) => a - b)

//   const medianVolume =
//     volumes.length % 2 === 0
//       ? (volumes[volumes.length / 2 - 1] + volumes[volumes.length / 2]) / 2
//       : volumes[Math.floor(volumes.length / 2)]

//   let upSteps = 0
//   let maxDrop = 0

//   for (let j = index - lookback + 1; j <= index; j++) {
//     const prev = data[j - 1].volume
//     const curr = data[j].volume

//     if (curr > prev) upSteps++

//     const dropFromMedian = (medianVolume - curr) / medianVolume
//     if (dropFromMedian > maxDrop) {
//       maxDrop = dropFromMedian
//     }
//   }

//   const upScore = upSteps / lookback
//   const penalty = Math.min(maxDrop / maxAllowedMedianDrop, 1)

//   return upScore * (1 - penalty)
// }

export const calculateVolumeTrendScore = (
  tickArray: TickArray,
  index: number,
  requestParams: Partial<RequestParams>,
): number | null => {
  const { algoParams } = requestParams
  if (
    !tickArray.length ||
    !algoParams ||
    typeof algoParams.volumeTrendLookback !== 'number' ||
    typeof algoParams.volumeTrendMinTrend !== 'number' ||
    typeof algoParams.volumeTrendMinSurge !== 'number'
  ) return null

  const lookback = algoParams.volumeTrendLookback
  const minUpTrendScore = algoParams.volumeTrendMinTrend || 0.65
  const minSurgeMultiplier = algoParams.volumeTrendMinSurge || 1.2

  if (index < lookback - 1) return null

  const slice = tickArray.slice(index - lookback + 1, index + 1)
  const volumes = slice.map((d) => d.volume)

  const lastVolume = volumes[volumes.length - 1]
  const avgVolume = volumes.slice(0, -1).reduce((sum, v) => sum + v, 0) / (volumes.length - 1)

  // Remove one high-volume spike from trend scoring
  const volumesForTrend = [...volumes]
  const maxIndex = volumesForTrend.indexOf(Math.max(...volumesForTrend))
  volumesForTrend.splice(maxIndex, 1)

  // Pairwise up comparison
  let upCount = 0
  let total = 0
  for (let i = 0; i < volumesForTrend.length - 1; i++) {
    for (let j = i + 1; j < volumesForTrend.length; j++) {
      total++
      if (volumesForTrend[j] > volumesForTrend[i]) upCount++
    }
  }

  const trendScore = total > 0 ? upCount / total : 0
  const surgeRatio = avgVolume > 0 ? lastVolume / avgVolume : 0

  // Only return trendScore if both conditions are met
  if (trendScore >= minUpTrendScore && surgeRatio >= minSurgeMultiplier) {
    return trendScore
  }

  return 0
}

/* EXPERIMENTAL VOLUME TREND ANALYSIS */

// const myData = [null, null, null, null, null, null, null, null, null, 100, 101, 500, 110, 105, 99]

// const valueTrend = (data, lookback, index) => {
//   let upCount = 0
//   let downCount = 0

//   for (let i = index - lookback + 1; i < data.length; i++) {
//     const window = data.slice(i)
//     for (let j = 0; j < window.length; j++) {
//       if (j === 0) continue

//       if (window[0] <= window[j]) {
//         upCount++
//       } else {
//         downCount++
//       }
//     }
//     console.log(window, upCount, downCount)
//   }
// }

// // valueTrend(myData, 6, 14)

// const valueTrend2 = (data, lookback, index) => {
//   let upCount = 0
//   let downCount = 0
//   let windowUpCount = 0
//   let windowDownCount = 0

//   for (let i = index - lookback + 1; i < data.length; i++) {
//     const window = data.slice(i)
//     for (let j = 0; j < window.length; j++) {
//       if (j === 0) continue

//       if (window[0] <= window[j]) {
//         upCount++
//       } else {
//         downCount++
//       }
//     }

//     if (upCount > downCount) {
//       windowUpCount++
//     } else {
//       windowDownCount++
//     }
//     upCount = 0
//     downCount = 0
//   }
//   console.log(windowUpCount, windowDownCount)
// }

// valueTrend2(myData, 6, 14)

/* END */

