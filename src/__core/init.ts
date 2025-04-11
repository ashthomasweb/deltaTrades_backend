/* src/core/init.ts */
import { EventBus } from './eventBus'
import { RealTimeService } from '../services/data/realTimeService'
import { HistoricalService } from '../services/data/historicalService'
import { WebSocketServer } from '../websocket/server'
import { Logger } from './logger'

export function initApp() {
  Logger.info('Initializing DeltaTrades backend...')

  const eventBus = new EventBus()

  const realTime = new RealTimeService(eventBus)
  const historical = new HistoricalService(eventBus)
  const wsServer = new WebSocketServer(eventBus)

  const historicalRequest = {
    function: 'TIME_SERIES_INTRADAY',
    symbol: 'TSLA',
    interval: '60min',
    month: '2022-10',
    outputsize: 'compact',
    apikey: process.env.ALPHA_VANTAGE_KEY,
  }
  // historical.fetch(historicalRequest)

  realTime.startStream()

  Logger.info('DeltaTrades backend initialized.')
}
