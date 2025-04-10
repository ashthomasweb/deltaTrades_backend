// import { EventBus } from '../../__core/eventBus'

// export class HistoricalService {
//   constructor(private bus: EventBus) {}

//   fetchInitialData() {
//     const mockHistoricalData = [{ symbol: 'SPY', prices: [430, 432, 435, 437] }]
//     setTimeout(() => {
//       this.bus.emit('historical:data', mockHistoricalData)
//     }, 2500)
//   }
// }

// historicalService.ts
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
}
