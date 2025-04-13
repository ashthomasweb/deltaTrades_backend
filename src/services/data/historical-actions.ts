/* src/services/brokerage/historical-actions.ts */

import { Logger } from '../../__core/logger'
import { HistoricalService } from './historical-service'

export const historicalActions = {
  sendMock: (service: HistoricalService, path: string) => {
    Logger.info(`Sending MOCK-DATA from ${path}`) // TODO: Convert 'Sending' to 'Requesting' once frontend has control
    service.fetchMock(path)
  },
  sendRequested: (
    service: HistoricalService,
    parsedMsg: any,
    params: any = null,
  ) => {
    Logger.info('ATTN! Using rate-limited historical endpoint!') // TODO: Log the count somehow - see comment in /__core/config

    // TODO: Replace with passed 'params' from frontend or default/saved values from backend
    const historicalRequest = {
      function: 'TIME_SERIES_INTRADAY',
      symbol: parsedMsg.symbol,
      interval: '1min',
      month: '2025-03',
      outputsize: 'compact',
      apikey: process.env.ALPHA_VANTAGE_KEY,
    }
    // END

    service.fetch(historicalRequest)
  },
}
