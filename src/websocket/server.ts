/**
 * @file src/websocket/server.ts
 * @fileoverview WebSocket server class for DeltaTrades backend, providing real-time 
 * communication between backend services and the frontend application.
 * 
 * Attention:
 * - For frontend and backend service communication and data transfer— **NOT for business logic or data fetching**.
 * 
 * Features:
 * - Listens on port `8080` for incoming WebSocket client connections.
 * - Handles client message routing through a pre-request router service.
 * - Broadcasts backend data events (real-time, historical, analysis) to connected clients.
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
 * - Designed to act as a **real-time delivery layer** within the backend.
 * - Couples tightly with the EventBus pattern for loose coupling between services and UI.
**/

import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import WebSocket, { WebSocketServer as WSS } from 'ws'
import preRequestRouter from '../services/data-pipeline/_pre-request-router'
import { ChartData, RequestParams } from '@/types'
import EventEmitter from 'events'

export class WebSocketServer {
  private wss: WSS
  private _listening = false
  private bus: EventEmitter
  private clients: Set<WebSocket>

  constructor() {
    this.wss = new WSS({ port: 8080 })
    this.bus = EventBus
    this.clients = new Set()

    this.wss.on('listening', () => {
      Logger.info('WebSocket server is listening on port 8080')
      this._listening = true
    })

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws)

      ws.send(JSON.stringify({ msg: 'Established' }))

      ws.on('message', (message) => {
        try {
          const requestParams: Partial<RequestParams> = JSON.parse(message.toString())
          Logger.info('Websocket received message:', requestParams)
          preRequestRouter(requestParams)
        } catch (err) {
          console.error('Error handling WS message:', err)
        }
      })
    })

    this.wss.on('close', () => {
      Logger.info('WebSocket server closed')
      this._listening = false
    })

    /* Frontend return events */
    this.bus.on('realTime:data', (data: any, id: number) => {
      const message = JSON.stringify({ type: 'realTime', data, id })
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })

    this.bus.on('historical:data', (data: any) => {
      const message = JSON.stringify({ type: 'historical', data })
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })

    this.bus.on('analysisResults:data', (algoResults: any, chartData: ChartData) => {
      const message = JSON.stringify({ type: 'analysis', algoResults, data: { ...chartData } })
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })
    /* END frontend return events */
  }

  get listening() {
    return this._listening
  }

  close() {
    for (const client of this.wss.clients) {
      client.close()
    }
    this.wss.close()
  }
}
