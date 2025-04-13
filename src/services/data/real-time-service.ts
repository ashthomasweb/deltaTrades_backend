/* src/services/brokerage/real-time-service.ts */

import { config } from '../../__core/config'
import { EventBus } from '../../__core/event-bus'
import { Logger } from '../../__core/logger'
// import { marketDataAdapter } from './_market-data-adapter'
import axios from 'axios'
import WebSocket from 'ws'

export class RealTimeService {
  sessionid: string = ''

  constructor(private bus: EventBus) {}

  async startStream() {
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
      const response = await axios.post(
        config.REALTIME_SESSION_URL,
        {},
        options,
      )
      this.sessionid = response.data.stream.sessionid
    } catch (error) {
      Logger.error('Failed to create Tradier stream \r\n', error)
    }
  }

  async initTradierWS() {
    const tradierStream = new WebSocket(config.REALTIME_WS_BASE_URL)
    let streamPollInterval = 30_000 // TODO: Investigate - v1 had an interval set to 30sec... But the api returns on every new tick. API changed? Manual rate limiting?
    const sessionid = this.sessionid

    // TODO: These request specific params need to be controllable from the frontend, and persist after being set
    const symbols = ['TSLA']
    const linebreak = true
    const filter = ['summary']
    // END

    const streamRequestPayload = JSON.stringify({
      symbols,
      sessionid,
      linebreak,
      filter,
    })

    tradierStream.on('open', () => {
      Logger.info('Tradier Stream Open')
      tradierStream.send(streamRequestPayload)
    })

    tradierStream.on('message', (data) => {
      Logger.info('Tradier WS response:')
      Logger.info(JSON.parse(data.toString()))
      // TODO: use the marketDataAdapter to request realTime data with received params
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
