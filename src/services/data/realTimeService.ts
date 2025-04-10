// import { EventBus } from '../../__core/eventBus'

// export class RealTimeService {
//   constructor(private bus: EventBus) {}

//   connect() {
//     setInterval(() => {
//       const data = { symbol: 'SPY', price: Math.random() * 500 }
//       this.bus.emit('price:update', data)
//     }, 1000)
//   }
// }

import { marketDataAdapter } from './_marketDataAdapter'
import { EventBus } from '../../__core/eventBus'
import { Logger } from '../../__core/logger'

export class RealTimeService {
  constructor(private bus: EventBus) {}

  start(symbol: string) {
    Logger.info(`Starting real-time feed for ${symbol}`)
    setInterval(async () => {
      try {
        const data = await marketDataAdapter.fetchRealtime(symbol)
        this.bus.emit('price:update', data)
      } catch (error) {
        Logger.error(`Real-time fetch failed: ${error}`)
      }
    }, 3000)
  }
}
