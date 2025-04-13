import { Logger } from '../../__core/logger'
import { HistoricalService } from './historicalService'

export const historicalActions = {
  sendMock: (service: HistoricalService, path: string) => {
    Logger.info(`Requesting MOCK-DATA from ${path}`)
    service.fetchMock(path)
  },
  sendRequested: (
    service: HistoricalService,
    parsedMsg: any,
    params: any = null,
  ) => {
    Logger.info('ATTN! Using rate-limited historical endpoint!')

    const historicalRequest = {
      function: 'TIME_SERIES_INTRADAY',
      symbol: parsedMsg.symbol,
      interval: '1min',
      month: '2025-03',
      outputsize: 'compact',
      apikey: process.env.ALPHA_VANTAGE_KEY,
    }

    service.fetch(historicalRequest)
  },
}
