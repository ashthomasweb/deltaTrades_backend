/* src/services/brokerage/real-time-service.ts */

import { config } from '../../__core/config'
import { Logger } from '../../__core/logger'
import axios from 'axios'
import WebSocket from 'ws'
import EventBus from '../../__core/event-bus'
import EventEmitter from 'events'

export class RealTimeWebSocket {
  sessionid: string = ''
  params: Record<string, string | undefined> = {}
  private bus: EventEmitter

  constructor() {
    this.bus = EventBus
  }

  async startStream(params: Record<string, string | undefined>) {
    this.params = params
    await this.getSessionId()
    this.initTradierWS()
  }

  async getSessionId() {
    const options = {
      // TODO: Could be moved to a config file
      headers: {
        Authorization: `Bearer ${config.REALTIME_API_KEY}`,
        Accept: 'application/json',
      },
    }
    try {
      const response = await axios.post(config.REALTIME_SESSION_URL, {}, options)
      this.sessionid = response.data.stream.sessionid
    } catch (error) {
      Logger.error('Failed to create Tradier stream \r\n', error)
    }
  }

  async initTradierWS() {
    const tradierStream = new WebSocket(config.REALTIME_WS_BASE_URL)
    // TODO: Investigate - v1 had an interval set to 30sec... But the api returns on every new tick.
    // API changed? Manual rate limiting?
    let streamPollInterval = 30_000
    const sessionid = this.sessionid

    // TODO: These request specific params need to be controllable from the frontend, and persist after being set
    const symbols = [this.params.symbol]
    const linebreak = true
    const filter: string[] = ['summary']
    // END

    const streamRequestPayload = JSON.stringify({
      symbols,
      sessionid,
      linebreak,
      filter,
    })

    tradierStream.on('open', () => {
      Logger.info('Tradier Stream Open')
      setInterval(() => {
        tradierStream.send(streamRequestPayload)
      }, 1000)
    })

    tradierStream.on('message', (data) => {
      Logger.info('Tradier WS response:')
      const responseData = JSON.parse(data.toString())
      Logger.info(responseData)
      this.bus.emit('realTime:data', responseData)
    })

    tradierStream.on('error', (error) => {
      Logger.error(error)
    })

    tradierStream.on('close', () => {
      Logger.info('Tradier stream closed')
      tradierStream.terminate()
    })
  }
}
