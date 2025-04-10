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

  historical.fetchInitialData()
  realTime.connect()

  Logger.info('DeltaTrades backend initialized.')
}
