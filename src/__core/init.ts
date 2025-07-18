/* src/__core/init.ts */
/* Initialization module for core backend services for DeltaTrades */

import { WebSocketServer } from '../websocket/server'
import { Queue } from '../algorithms/_engine'
import { DataBaseClient } from '../database/db-client'
import { Logger } from './logger'

/**
 * Initializes the DeltaTrades backend application.
 *
 * Sets up:
 * - Database client for logs, transaction packets, and historical data.
 * - WebSocket server for frontend communication.
 * - Queue (will transition into DayCache) for daily data caching and windowed analysis.
 */
export async function initApp() {
  Logger.info('Initializing DeltaTrades backend...')

  /**
   * Database client for logs, transaction packets, and analysis data.
   */
  const dbClient = new DataBaseClient()
  // await dbClient.initDB() // TODO: Create DT MongoDB instance - turning off for now during app cleanup

  /**
   * WebSocket server for real-time frontend communication.
   */
  const wsServer = new WebSocketServer()

  /**
   * In-memory datastore for processing data; will evolve into DayCache for daily analysis.
   * TODO: Convert into daily storage with sliding window.
   */
  const queue = new Queue()

  Logger.info('DeltaTrades backend initialized.')
}
