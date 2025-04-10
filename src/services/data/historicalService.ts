import { EventBus } from '../../__core/eventBus'

export class HistoricalService {
  constructor(private bus: EventBus) {}

  fetchInitialData() {
    const mockHistoricalData = [{ symbol: 'SPY', prices: [430, 432, 435, 437] }]
    setTimeout(() => {
      this.bus.emit('historical:data', mockHistoricalData)
    }, 2500)
  }
}
