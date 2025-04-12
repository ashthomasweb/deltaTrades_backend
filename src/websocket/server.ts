import WebSocket, { WebSocketServer as WSS } from 'ws'
import { EventBus } from '../__core/eventBus'
import { HistoricalService } from '../services/data/historicalService'
import { Logger } from '../__core/logger'

const useMockFull = {
  use: true,
  path: './src/mockData/TSLA-1min-03-25-full.json',
}

const useMockCompact = {
  use: false,
  path: './src/mockData/TSLA-1min-03-25-compact.json',
}

export class WebSocketServer {
  private wss: WSS
  private _listening = false

  constructor(private bus: EventBus) {
    this.wss = new WSS({ port: 8080 })

    const historicalService = new HistoricalService(bus)

    this.wss.on('listening', () => {
      Logger.info('WebSocket server is listening on port 8080')
      this._listening = true
    })

    this.wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ msg: 'Established' }))
      this.bus.on('price:update', (data) =>
        ws.send(JSON.stringify({ type: 'price', data })),
      )

      ws.on('message', (message) => {
        // console.log('WS received msg: ', JSON.parse(message.toString()))
        try {
          const parsed = JSON.parse(message.toString())
          if (parsed.type === 'getHistorical') {
            if (useMockCompact.use || useMockFull.use) {
              historicalService.fetchMock(
                useMockFull.use ? useMockFull.path : useMockCompact.path,
              )

              this.bus.once('historical:data', (data) => {
                ws.send(
                  JSON.stringify({
                    type: 'historical',
                    data,
                  }),
                )
              })
            } else {
              console.log('ATTN! Using rate-limited historical endpoint!')
              const historicalRequest = {
                function: 'TIME_SERIES_INTRADAY',
                symbol: parsed.symbol,
                interval: '1min',
                month: '2025-03',
                outputsize: 'compact',
                apikey: process.env.ALPHA_VANTAGE_KEY,
              }
              historicalService.fetch(historicalRequest)

              this.bus.once('historical:data', (data) => {
                // console.log(data)
                ws.send(
                  JSON.stringify({
                    type: 'historical',
                    data,
                  }),
                )
              })
            }
            this.bus.once('historical:data', (data) => {
              ws.send(
                JSON.stringify({
                  type: 'historical',
                  data,
                }),
              )
            })

            // const mockHistoricalData = [
            //   { symbol: 'SPY', prices: [430, 432, 435, 437] },
            // ]

            // ws.send(
            //   JSON.stringify({
            //     type: 'historical',
            //     data: mockHistoricalData,
            //   }),
            // )
          }
        } catch (err) {
          console.error('Error handling WS message:', err)
        }
      })
    })

    this.wss.on('close', () => {
      Logger.info('WebSocket server closed')
      this._listening = false
    })
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
