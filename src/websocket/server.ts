/**
 * @file src/websocket/server.ts
 * @fileoverview WebSocket server class for DeltaTrades backend, providing realTime 
 * communication between backend services and the frontend application.
 * 
 * Attention:
 * - For frontend and backend service communication and data transfer— **NOT for business logic or data fetching**.
 * 
 * Features:
 * - Listens on port `8080` for incoming WebSocket client connections.
 * - Handles client message routing through a pre-request router service.
 * - Broadcasts backend data events (realTime, historical, analysis) to connected clients.
 * - Listens to an internal EventBus for backend events and emits them over WebSocket.
 * - Manages connected clients with graceful cleanup and server shutdown controls.
 * 
 * Usage:
 * Import and instantiate `WebSocketServer` to activate websocket-based data streaming.
 * Listens automatically upon construction.
 * 
 * Example:
 * const wsServer = new WebSocketServer()
 * 
 * Notes:
 * - Designed to act as a **realTime delivery layer** within the backend.
 * - Couples tightly with the EventBus pattern for loose coupling between services and UI.
**/

import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import WebSocket, { WebSocketServer as WSS } from 'ws'
import preRequestRouter from '../services/data-pipeline/_pre-request-router'
import { ChartData, RequestParams } from '@/types'
import EventEmitter from 'events'
import DebugService from '../services/debug'

export class WebSocketServer {
  private readonly wss: WSS
  private _listening = false
  private readonly bus: EventEmitter
  private readonly clients: Set<WebSocket>

  /**
   * @description Initializes the WebSocket server and binds all required WebSocket and EventBus event listeners.
   * 
   * Starts listening on port 8080 immediately upon instantiation.
   */
  constructor() {
    this.wss = new WSS({ port: 8080 })
    this.bus = EventBus
    this.clients = new Set()

    this.bindWebSocketEvents()
    this.bindBusEvents()
  }

  /**
   * @method bindWebSocketEvents
   * @description Handles setup of all events the the WebSocket Server
   * 
   * Binds WebSocket server events for:
   * - Listening state
   * - New client connections
   * - Incoming client messages
   * - Client disconnections
   * - Client errors
   * 
   * Routes valid incoming messages through the preRequestRouter and manages client cleanup.
   * @private
   */
  private bindWebSocketEvents() {
    this.wss.on('listening', () => {
      Logger.info('WebSocket server is listening on port 8080')
      this._listening = true
    })

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws)
      ws.send(JSON.stringify({ msg: 'Established' }))
      Logger.info(`Client connected. Total clients: ${this.clients.size}`)

      ws.on('message', (message) => {
        try {
          const requestParams: Partial<RequestParams> = JSON.parse(message.toString())
          Logger.info('Websocket received message of type:', requestParams.requestType)
          preRequestRouter(requestParams)
        } catch (err) {
          // Logger.error('Error handling WS message:', err) // TODO: 'Logger' class causes test to fail...
          console.error('Error handling WS message:', err)
        }
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        Logger.info(`Client disconnected. Remaining clients: ${this.clients.size}`)
      })

      ws.on('error', (err) => {
        Logger.error(`WebSocket error from client: ${err.message}`)
      })
    })

    this.wss.on('close', () => {
      Logger.info('WebSocket Server closed')
      this._listening = false
    })
  }

  /**
   * @method bindBusEvents
   * @description Subscribes to internal EventBus events and forwards them to connected clients over WebSocket.
   * 
   * Broadcasts:
   * - 'realTime:data' for realTime updates
   * - 'historical:data' for historical data responses
   * - 'analysisResults:data' for analysis outputs
   * @private
   */
  private bindBusEvents() {
    this.bus.on('realTime:data', (data: any, id: number) => {
      const message = JSON.stringify({ type: 'realTime', data, id })
      this.broadcastToAllClients(message)
    })

    this.bus.on('historical:data', (data: any) => {
      DebugService.trace('server event: historical:data')
      const message = JSON.stringify({ type: 'historical', data })
      this.broadcastToAllClients(message)
    })

    this.bus.on('analysisResults:data', (algoResults: any, chartData: ChartData) => {
      const message = JSON.stringify({ type: 'analysis', algoResults, data: { ...chartData } })
      this.broadcastToAllClients(message)
    })
  }

  /**
   * @method broadcastToAllClients
   * @description Broadcasts a serialized message string to all currently connected WebSocket clients.
   * 
   * @param message - The pre-serialized message string to broadcast.
   */
  broadcastToAllClients(message: string) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  /**
   * @method listening
   * @description Returns the current listening state of the WebSocket server.
   * 
   * @returns {boolean} Whether the server is actively listening for WebSocket connections.
   */
  get listening(): boolean {
    return this._listening
  }

  /**
   * @method close
   * @description Gracefully closes all active WebSocket client connections and shuts down the WebSocket server.
   */
  close() {
    for (const client of this.wss.clients) {
      client.close()
    }
    this.wss.close()
  }
}
