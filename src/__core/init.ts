/* src/__core/init.ts */

import { WebSocketServer } from '../websocket/server'
import { Queue } from '../algorithms/_engine'
import { DataBaseClient } from '../database/db-client'
import { Logger } from './logger'
import { runOnInit } from '../utils/run-on-init'

export async function initApp() {
  Logger.info('Initializing DeltaTrades backend...')

  const dbClient = new DataBaseClient()
  // await dbClient.initDB() // TODO: Create DT MongoDB instance - turning off for now during app cleanup

  // TODO: Create input mechanism to receive data requests from the queue for active trading...
  // perhaps pipe directly into the preRequestRouter?
  const wsServer = new WebSocketServer()
  const queue = new Queue()

  Logger.info('DeltaTrades backend initialized.')

  // runOnInit() // **Optional** Run functions related to development cycle - Contains no actual business logic
}
