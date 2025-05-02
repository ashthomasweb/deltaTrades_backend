/* src/services/brokerage/historical-actions.ts */

import { Logger } from '../../__core/logger'
import { marketDataAdapter } from './_market-data-adapter'
import postRequestControlFlow from './_post-request-control-flow'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '../../types/types'

export const historicalActions = {
  sendMock: async (requestParams: Partial<RequestParams>) => {
    Logger.info(`historicalActions sendMock - ${requestParams.savedData}`)

    const localStoredDataRootPath = './src/mockData/'

    try {
      const data = await marketDataAdapter.fetchMock(
        `${localStoredDataRootPath}${requestParams.savedData}`,
      )
      postRequestControlFlow(data, requestParams)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  },
  sendRequested: async (requestParams: Partial<RequestParams>) => {
    Logger.info('ATTN! Using rate-limited historical endpoint!') // TODO: Log the count somehow - see comment in /__core/config
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
      const data = await marketDataAdapter.fetchHistorical(paramString)
      postRequestControlFlow(data, requestParams)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  },
}
