import WebSocket, { WebSocketServer as WSS } from 'ws'
import { EventBus } from '../__core/eventBus'
import { HistoricalService } from '../services/data/historicalService'

export class WebSocketServer {
  private wss: WSS

  constructor(private bus: EventBus) {
    this.wss = new WSS({ port: 8080 })

    const historicalService = new HistoricalService(bus)

    this.wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ msg: 'Established' }))
      this.bus.on('price:update', (data) =>
        ws.send(JSON.stringify({ type: 'price', data })),
      )

      ws.on('message', (message) => {
        console.log('WS received msg: ', message)
        try {
          const parsed = JSON.parse(message.toString())
          if (parsed.type === 'getHistorical') {

            const historicalRequest = {
              function: 'TIME_SERIES_INTRADAY',
              symbol: 'TSLA',
              interval: '60min',
              month: '2025-03',
              outputsize: 'partial',
              apikey: process.env.ALPHA_VANTAGE_KEY,
            }
            historicalService.fetch(historicalRequest)

            this.bus.once('historical:data', (data) => {
              ws.send(
                JSON.stringify({
                  type: 'historical',
                  data,
                })
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
  }
}
