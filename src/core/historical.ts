import { EventBus } from './eventBus';

export class HistoricalService {
  constructor(private bus: EventBus) {}

  fetchInitialData() {
    console.log('***\n%cTRACE: fetchInitData', 'color: green; font-weight: 900')
    const mockHistoricalData = [
      { symbol: 'SPY', prices: [430, 432, 435, 437] },
    ];
    setTimeout(() => {
      console.log('***\n%cTRACE: send', 'color: green; font-weight: 900')

      this.bus.emit('historical:data', mockHistoricalData);
    }, 2500)
  }
}