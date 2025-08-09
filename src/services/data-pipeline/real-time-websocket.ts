/**
 * @file src/services/brokerage/real-time-service.ts
 * @fileoverview Manages real-time streaming of market data via Tradier WebSocket.
 *
 * Responsibilities:
 * - Retrieves and authenticates session ID from Tradier.
 * - Initializes WebSocket connection and subscription payload.
 * - Routes real-time data to the EventBus for consumption by downstream modules.
 */

import { config, realTimeWebSocketSessionIdHeaders } from '../../__core/config'
import { Logger } from '../../__core/logger'
import axios from 'axios'
import WebSocket from 'ws'
import EventBus from '../../__core/event-bus'
import EventEmitter from 'events'

export class RealTimeWebSocket {
  private sessionId: string = ''
  private params: Record<string, string | undefined> = {}
  private bus: EventEmitter

  constructor() {
    this.bus = EventBus
  }

  /**
   * @function startStream
   * @description Starts the real-time stream by retrieving a session ID and initializing the WebSocket connection.
   *
   * @param params - Request parameters, must include `symbol` used for Tradier subscription.
   * @returns A Promise that resolves after the WebSocket stream is initialized.
   */
  async startStream(params: Record<string, string | undefined>) {
    this.params = params
    const success = await this.getSessionId()

    if (!success) {
      Logger.info('Aborting stream start due to failed session ID retrieval.')
      return
    }

    this.initTradierWS()
  }

  /**
   * @function getSessionId
   * @description Retrieves a session ID from Tradier for authenticated WebSocket access.
   * 
   * @returns A Promise that resolves after the session ID is retrieved and stored.
   */
  async getSessionId() {
    const options = {
      headers: realTimeWebSocketSessionIdHeaders
    }
    try {
      const response = await axios.post(config.REALTIME_SESSION_URL, {}, options)
      this.sessionId = response.data.stream.sessionid
      return true
    } catch (error) {
      Logger.error('Failed to create Tradier stream.', error)
      return false
    }
  }

  /**
   * @function initTradierWS
   * @description Initializes the WebSocket connection to Tradier, subscribes to real-time data, and 
   * routes incoming messages to the EventBus.
   * 
   * @returns A Promise that resolves after the WebSocket connection is established.
   */
  async initTradierWS() {
    const tradierStream = new WebSocket(config.REALTIME_WS_BASE_URL)
    
    const sessionid = this.sessionId

    // TODO: These request specific params need to be controllable from the frontend, and persist after being set
    const symbols = [this.params.symbol]
    const linebreak = true
    const filter: string[] = ['summary']
    // END

    const buildStreamPayload = () => {
      return JSON.stringify({
        symbols,
        sessionid,
        linebreak,
        filter,
      })
    }

    const streamRequestPayload = buildStreamPayload()

    let intervalId: ReturnType<typeof setInterval>

    tradierStream.on('open', () => {
      Logger.info('Tradier Stream Open')
      intervalId = setInterval(() => {
        tradierStream.send(streamRequestPayload)
      }, 1000)
    })

    tradierStream.on('message', (data) => {
      const responseData = JSON.parse(data.toString())
      Logger.info('Tradier WS response:', responseData)
      this.bus.emit('realTime:data', responseData)
    })

    tradierStream.on('error', (error) => {
      Logger.error(error)
    })

    tradierStream.on('close', () => {
      Logger.info('Tradier stream closed')
      clearInterval(intervalId)
      tradierStream.terminate()
    })
  }
}
