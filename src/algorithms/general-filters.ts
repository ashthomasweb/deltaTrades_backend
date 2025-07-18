import { ExtTick, TickArray } from '@/types'
import { createCandleSizeDistributionMaps, findSingleTickBodyDistribution } from './distributions-ranges'

export const filterByConfirmed = (fullData: ExtTick[], filteredData: ExtTick[]) => {
  let result = []
  for (let i = 0; i < filteredData.length; i++) {
    if (filteredData[i].isGreen === filteredData[i].isNextGreen) {
      result.push(fullData[filteredData[i].originalIndex! + 1])
    }
  }
  return result
}

export const filterByCandleDistribution = (data: TickArray, lowerThreshold: number) => {
  let result = []
  const candleSizeDistributionMap = createCandleSizeDistributionMaps(data)
  for (const tick of data) {
    if (
      findSingleTickBodyDistribution(
        tick,
        candleSizeDistributionMap.body.range,
        candleSizeDistributionMap.body.distBlock,
      ) > lowerThreshold
    ) {
      result.push(tick)
    }
  }
  return result
}

// const filterByDoubleBars = (data: Tick[], tolerance: number) => {
//   data.filter((tick: Tick) => {
//     for (let i = 0; i < data.length; i++) {
//       const tick = data[i]
//       if (i < 0) {
//         const previousTick = data[i - 1]
//         const tickBodyValue = Math.abs(tick.open - tick.close)
//         const previousTickBodyValue = Math.abs(tick.open - tick.close)
//       }
//     }
//   })
// }

// const filterOutAverageNoise = (data: Tick[], avgArray: number[]) => {
//   const result: Tick[] = []
//   let windowArray: Tick[] = []
//   for (let i = 10; i < data.length; i++) {
//     windowArray = data.slice(i - 10, i)

//     for (let j = 0; j < windowArray.length; j++) {
//       if (isGreenCandle(windowArray[j]) && )
//     }

//   }
// }
