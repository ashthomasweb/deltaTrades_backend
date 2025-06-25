/* Volume Utils */

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
