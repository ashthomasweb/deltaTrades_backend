/**
 * @file src/services/brokerage/historical-actions.ts
 * @fileoverview Service layer for sending historical market data to the processing pipeline.
 * 
 * This module routes historical data to the `postRequestRouter` by either:
 * - Reading from locally stored data files.
 * - Fetching from an external API (rate-limited).
 * 
 * Handles data retrieval and logging for historical backfills or testing.
**/

import { Logger } from '../../__core/logger'
import { marketDataFetcher } from './_market-data-fetcher'
import postRequestRouter from './_post-request-router'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '@/types'

export const historicalActions = {
  /**
   * @function sendStored
   * @description Sends historical data retrieved from local storage to the request router.
   * Logs the action, reads the stored data file, and passes it downstream.
   * 
   * @param requestParams - Parameters including savedData identifier.
   * @returns A Promise that resolves after routing the fetched data.
   */
  async sendStored(requestParams: Partial<RequestParams>) {
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

   /**
   * @function sendRequested
   * @description Sends historical data fetched from the external API to the request router.
   * Intended for requests to historical endpoints (rate-limited).
   * 
   * @param requestParams - Parameters including symbol, interval, month, and dataSize.
   * @returns A Promise that resolves after routing the fetched data.
   */
  async sendRequested(requestParams: Partial<RequestParams>) {
    Logger.info('ATTN! Using rate-limited historical endpoint.') // TODO: SYSTEM DESIGN - Track and log the daily rate-limit count
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
