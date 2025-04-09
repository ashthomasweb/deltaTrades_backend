import { EventBus } from './eventBus';

export class RealTimeService {
  constructor(private bus: EventBus) {}

  connect() {
    // Simulate data
    setInterval(() => {
      const data = { symbol: 'SPY', price: Math.random() * 500 };
      this.bus.emit('price:update', data);
    }, 1000);
  }
}