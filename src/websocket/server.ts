import WebSocket, { WebSocketServer as WSS } from 'ws'
import { EventBus } from '../__core/eventBus'
import { HistoricalService } from '../services/data/historicalService'
import { Logger } from '../__core/logger'
import { historicalActions } from '../services/data/historicalActions'

// TODO: Create mockConfig file and object to gather 'use' condition, path, and label for clear logging
const useMockFull = {
  use: false,
  path: './src/mockData/TSLA-1min-03-25-full.json',
}

const useMockCompact = {
  use: true,
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
      const sendOnce = (event: string, type: string) => {
        this.bus.once(event, (data) => ws.send(JSON.stringify({ type, data })))
      }

      ws.send(JSON.stringify({ msg: 'Established' }))

      this.bus.on('price:update', (data) =>
        ws.send(JSON.stringify({ type: 'price', data })),
      )

      ws.on('message', (message) => {
        Logger.info(
          'Websocket received message:',
          JSON.parse(message.toString()),
        )
        try {
          const parsedMsg = JSON.parse(message.toString())

          switch (parsedMsg.type) {
            case 'getHistorical':
              if (useMockCompact.use || useMockFull.use) {

                const mockPath = useMockCompact ? useMockCompact.path : useMockFull.path
                historicalActions.sendMock(historicalService, mockPath)
                sendOnce('historical:data', 'historical')


                // Logger.info(
                //   `Requesting MOCK-DATA from ${useMockCompact ? useMockCompact.path : useMockFull.path}`,
                // )

                // historicalService.fetchMock(
                //   useMockFull.use ? useMockFull.path : useMockCompact.path,
                // )

                // this.bus.once('historical:data', (data) => {
                //   ws.send(
                //     JSON.stringify({
                //       type: 'historical',
                //       data,
                //     }),
                //   )
                // })
              } else {
                historicalActions.sendRequested(historicalService, parsedMsg)
                sendOnce('historical:data', 'historical')
              }
              break

            default:
              break
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

  sendOnce = () => {}

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
