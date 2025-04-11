// import { EventBus } from '../../__core/eventBus'

// export class RealTimeService {
//   constructor(private bus: EventBus) {}

//   connect() {
//     setInterval(() => {
//       const data = { symbol: 'SPY', price: Math.random() * 500 }
//       this.bus.emit('price:update', data)
//     }, 1000)
//   }
// }

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
        Accept: "application/json"
      },
    }
    try {
      const response = await axios.post(config.REALTIME_SESSION_URL, {}, options)
      this.sessionid = response.data.stream.sessionid
    } catch (error) {
      console.error('Failed to create Tradier stream \r\n', error)
    }
  }

  async initTradierWS() {
    const tradierStream = new WebSocket(config.REALTIME_WS_BASE_URL)

    const symbols = ["TSLA"]
    const linebreak = true
    const sessionid = this.sessionid

    const streamRequestPayload = JSON.stringify({
      symbols,
      sessionid,
      linebreak,
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
      // console.log(data)
    })

    tradierStream.on("close", () => {
      console.log("Tradier stream closed")
      // clearInterval(tradeDataInterval)
      tradierStream.terminate()
    })
  }

  // start(symbol: string) {
  //   Logger.info(`Starting real-time feed for ${symbol}`)
  //   setInterval(async () => {
  //     try {
  //       const data = await marketDataAdapter.fetchRealtime(symbol)
  //       this.bus.emit('price:update', data)
  //     } catch (error) {
  //       Logger.error(`Real-time fetch failed: ${error}`)
  //     }
  //   }, 3000)
  // }
}
