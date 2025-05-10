import { marketDataFetcher } from '../services/data/_market-data-fetcher'
// import DataAdapter from '../services/data-adapter'
import { Logger } from '../__core/logger'

export const runOnInit = async () => {
  Logger.info('DEV CYCLE TEMP FUNCTIONS:')
  // ATTENTION!
  // DO NOT PLACE ANY APPLICATION CRITICAL BUSINESS LOGIC IN THIS FILE.
  // FOR DEVELOPMENT CYCLE PURPOSES ONLY

  let mockFilePath = './src/mockData/TSLA-1min-03-25-compact.json'
  const data = await marketDataFetcher.fetchHistoricalSavedData(mockFilePath)

  Logger.info('END - DEV CYCLE TEMP FUNCTIONS')
}
