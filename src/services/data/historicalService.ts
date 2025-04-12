import { marketDataAdapter } from './_marketDataAdapter'
import { EventBus } from '../../__core/eventBus'
import { Logger } from '../../__core/logger'
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
    // Logger.info(`Fetching historical data for ${params.symbol}`)
    try {
      const data = await marketDataAdapter.fetchMock(filepath)
      // console.log(data)
      this.bus.emit('historical:data', data)
    } catch (error) {
      Logger.error(`Historical fetch failed: ${error}`)
    }
  }
}
