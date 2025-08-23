/**
 * @file src/__core/init.ts
 * @fileoverview Initialization module for core backend services for DeltaTrades.
 * 
 * This module handles the startup process for the backend application, including:
 * - Initializing database connections.
 * - Starting the WebSocket server for realTime communication with the frontend.
 * - Preparing in-memory queue structures for daily data caching and analysis.
 * 
 * Usage:
 * Call `initApp()` at the application entry point to initialize core services before starting
 * any data pipelines or trading processes.
**/

import { WebSocketServer } from '../websocket/server'
import { AlgoEngine } from '../algorithms/_engine'
import { DataBaseClient } from '../database/db-client'
import { Logger } from './logger'
import { runOnInit } from '@/utils/run-on-init'
import AlgoEngineManager from '../algorithms/_engine-manager'

/**
 * Initializes the DeltaTrades backend application.
 */
export async function initApp() {
  Logger.info('Initializing DeltaTrades backend...')

  /**
   * Database client for logs, transaction packets, and analysis data.
   */
  const dbClient = new DataBaseClient()
  // await dbClient.initDB() // TODO: ARCHITECTURE - Create DT MongoDB instance - turning off for now during app cleanup

  /**
   * WebSocket server for realTime frontend communication.
   */
  const wsServer = new WebSocketServer()

  /**
   * In-memory datastore for processing data; will evolve into DayCache for daily analysis.
   * TODO: ARCHITECTURE - Convert into daily storage with sliding window.
   */
  // const algoEngine = new AlgoEngine()
  AlgoEngineManager.init()


  // runOnInit()

  Logger.info('DeltaTrades backend initialized.')
}
