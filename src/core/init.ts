/* src/core/init.ts */
import { EventBus } from './eventBus';
import { RealTimeService } from './realTime';
import { HistoricalService } from './historical';
import { WebSocketServer } from './server';
import { Logger } from './logger';

export function initApp() {
  Logger.info('Initializing AlgoTrader backend...');

  const eventBus = new EventBus();

  const realTime = new RealTimeService(eventBus);
  const historical = new HistoricalService(eventBus);
  const wsServer = new WebSocketServer(eventBus);

  historical.fetchInitialData();
  realTime.connect();

  Logger.info('AlgoTrader backend initialized.');
}