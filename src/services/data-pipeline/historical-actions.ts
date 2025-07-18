/* src/services/brokerage/historical-actions.ts */

import { Logger } from '../../__core/logger'
import { marketDataFetcher } from './_market-data-fetcher'
import postRequestRouter from './_post-request-router'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '@/types'

export const historicalActions = {
  sendStored: async (requestParams: Partial<RequestParams>) => {
    Logger.info(`historicalActions sendStored - ${requestParams.savedData}`)

    const localStoredDataRootPath = './src/storedData/'

    try {
      const data = await marketDataFetcher.fetchHistoricalSavedData(
        `${localStoredDataRootPath}${requestParams.savedData}`,
      )
      postRequestRouter(data, requestParams)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  },
  sendRequested: async (requestParams: Partial<RequestParams>) => {
    Logger.info('ATTN! Using rate-limited historical endpoint!') // TODO: Log the count somehow
    Logger.info('historicalActions sendRequested')

    const historicalRequest = {
      function: 'TIME_SERIES_INTRADAY',
      symbol: requestParams.symbol,
      interval: requestParams.interval,
      month: requestParams.month,
      outputsize: requestParams.dataSize === 'full' ? 'full' : 'compact',
      extended_hours: 'false', // NOTE: Not available in FE requestParams
      apikey: process.env.ALPHA_VANTAGE_KEY,
    }

    const paramString = buildParamString(historicalRequest)

    try {
      const data = await marketDataFetcher.fetchHistorical(paramString)
      postRequestRouter(data, requestParams)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  },
}
