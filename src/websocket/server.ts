/* src/websocket/server.ts */

import { EventBus } from '../__core/event-bus'
import { Logger } from '../__core/logger'
import { historicalActions } from '../services/data/historical-actions'
import { HistoricalService } from '../services/data/historical-service'
import WebSocket, { WebSocketServer as WSS } from 'ws'

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
      // TODO: Extract event-based 'ws' functions away - perhaps a class that accepts 'ws' and 'bus' in the contructor, and is imported
      // Send data upon 'once' event
      const sendOnceData = (event: string, type: string) => {
        this.bus.once(event, (data) => ws.send(JSON.stringify({ type, data })))
      }

      ws.send(JSON.stringify({ msg: 'Established' }))

      this.bus.on('price:update', (data) =>
        ws.send(JSON.stringify({ type: 'price', data })),
      )

      ws.on('message', (message) => {
        try {
          Logger.info(
            'Websocket received message:',
            JSON.parse(message.toString()),
          )
          const parsedMsg = JSON.parse(message.toString())
          const useMockData = useMockCompact.use || useMockFull.use

          switch (parsedMsg.type) {
            case 'getHistorical':
              // TODO: Elegantly handle the mock conditions. Recommend requesting mock/non-mock data, and which dataset directly from frontend.
              // This will enable the server to remain running - potentially trading - while research/testing is being performed.
              if (useMockData) {
                const mockPath = useMockCompact
                  ? useMockCompact.path
                  : useMockFull.path
                historicalActions.sendMock(historicalService, mockPath)
                sendOnceData('historical:data', 'historical')
              } else {
                historicalActions.sendRequested(historicalService, parsedMsg)
                sendOnceData('historical:data', 'historical')
              }
              break

            case 'monitorRealTime':
              // TODO: Tap into existing stream
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
