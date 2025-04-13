import axios from 'axios'
import { config } from '../../__core/config'

import { marketDataAdapter } from './_marketDataAdapter'
import { EventBus } from '../../__core/eventBus'
import { Logger } from '../../__core/logger'
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
      console.error('Failed to create Tradier stream \r\n', error)
    }
  }

  async initTradierWS() {
    const tradierStream = new WebSocket(config.REALTIME_WS_BASE_URL)
    let streamPollInterval = 30_000 // TODO: v1 had an interval set to 30sec... But the api returns on every new tick. API changed?

    const symbols = ['TSLA']
    const linebreak = true
    const sessionid = this.sessionid
    const filter = ['summary']

    const streamRequestPayload = JSON.stringify({
      symbols,
      sessionid,
      linebreak,
      filter,
    })

    tradierStream.on('open', () => {
      console.log('Tradier Stream Open')
      tradierStream.send(streamRequestPayload)
    })

    tradierStream.on('message', (data) => {
      console.log('Tradier WS response:')
      console.log(JSON.parse(data.toString()))
    })

    tradierStream.on('error', (error) => {
      console.error(error)
    })

    tradierStream.on('close', () => {
      console.log('Tradier stream closed')
      tradierStream.terminate()
    })
  }
}
