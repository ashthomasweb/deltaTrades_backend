/* src/core/init.ts */
import { EventBus } from './eventBus'
import { RealTimeService } from '../services/data/realTimeService'
import { HistoricalService } from '../services/data/historicalService'
import { WebSocketServer } from '../websocket/server'
import { Logger } from './logger'
// import { initDB } from '../database/dbClient'

export async function initApp() {
  Logger.info('Initializing DeltaTrades backend...')
  // await initDB() // TODO: Create DT MongoDB instance - turning off for now during app cleanup

  const eventBus = new EventBus()

  const realTime = new RealTimeService(eventBus)
  const historical = new HistoricalService(eventBus)
  const wsServer = new WebSocketServer(eventBus)

  // realTime.startStream() // ATTN: Turning off until we get real-time data into pipeline

  Logger.info('DeltaTrades backend initialized.')
}
