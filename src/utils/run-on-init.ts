import { marketDataAdapter } from '../services/data/_market-data-adapter'
import DataAdapter from '../services/data-adapter'
import { Logger } from '../__core/logger'

export const runOnInit = async () => {
  Logger.info('DEV CYCLE TEMP FUNCTIONS:')
  // ATTENTION!
  // DO NOT PLACE ANY APPLICATION CRITICAL BUSINESS LOGIC IN THIS FILE.
  // FOR DEVELOPMENT CYCLE PURPOSES ONLY

  let mockFilePath = './src/mockData/TSLA-1min-03-25-compact.json'
  const data = await marketDataAdapter.fetchMock(mockFilePath)
  const historicalAdapter = new DataAdapter(
    'historical',
    'AlphaVantage',
    'queue',
    data,
  )
  const result = historicalAdapter.returnFormattedData()

  console.log('\nadapter output for AV-historical to chart\n', result)
  //   console.log(result.id)
  //   console.log(result.creationMeta)
  //   console.log(result.metaData)
  //   console.log(result.chartData.categoryData[0], result.chartData.categoryData[10])
  //   console.log(result.chartData.values[0], result.chartData.values[10])
  //   console.log(result.chartData.volumes[0], result.chartData.volumes[10])

  //   function testIntervalTick() {
  //     for (let i = 0; i < 1; i++) {
  //       setTimeout(async () => {
  //         let realTimeAPITest = await marketDataAdapter.fetchRealtime({
  //           symbol: 'TSLA',
  //           interval: '1min',
  //           start: `2025-04-25 15:3${i.toString()}`,
  //           end: `2025-04-25 15:3${(i + 1).toString()}`,
  //           session_filter: 'open',
  //         })
  //         console.log('realTimeTest:', realTimeAPITest.series.data[0])
  //       }, i * 2500)
  //     }
  //   }
  //   testInterTick()

  //   async function testRealTimeAdapter() {
  //     const options = {
  //       symbol: 'TSLA',
  //       interval: '1min',
  //       start: `2025-04-25 15:30`,
  //       end: `2025-04-25 15:45`,
  //       session_filter: 'open',
  //     }

  //     const realTimeData = await marketDataAdapter.fetchRealtime(options)

  //     const realTimeAdapter = new DataAdapter(
  //       'real-time',
  //       'Tradier',
  //       'chart',
  //       realTimeData,
  //       options,
  //     )

  //     const result = realTimeAdapter.returnFormattedData()
  //     console.log('\nadapter output for realTime\n', result)
  //   }
  //   testRealTimeAdapter()

  Logger.info('END - DEV CYCLE TEMP FUNCTIONS')
}
