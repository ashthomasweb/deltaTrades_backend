/* src/services/brokerage/historical-actions.ts */

import { EventBus } from '../../__core/event-bus'
import { Logger } from '../../__core/logger'
import { marketDataAdapter } from './_market-data-adapter'
import { buildParamString } from '../../utils/api'

export class HistoricalService {
  constructor(private bus: EventBus) {}

  async fetch(params: any) {
    Logger.info(`Fetching historical data for ${params.symbol}`)
    const paramString = buildParamString(params)
    try {
      const data = await marketDataAdapter.fetchHistorical(paramString)
      this.bus.emit('historical:data', data)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  }

  async fetchMock(filepath: string) {
    // Logger.info(`Fetching historical data for ${params.symbol}`) // TODO: Implement once mock request is controllable from frontend
    try {
      const data = await marketDataAdapter.fetchMock(filepath)
      this.bus.emit('historical:data', data)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  }
}
