/* src/websocket/server.ts */

import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import WebSocket, { WebSocketServer as WSS } from 'ws'
import preRequestControlFlow from '../services/data/_pre-request-control-flow'
import { RequestParams } from '../types/types'

export class WebSocketServer {
  private wss: WSS
  private _listening = false
  private bus: any

  constructor() {
    this.wss = new WSS({ port: 8080 })
    this.bus = EventBus

    this.wss.on('listening', () => {
      Logger.info('WebSocket server is listening on port 8080')
      this._listening = true
    })

    this.wss.on('connection', (ws: WebSocket) => {
      /* EventBus helper functions */
      // Send data upon 'once' event
      const sendOnceData = (event: string, type: string | undefined) => {
        this.bus.once(event, (data) => ws.send(JSON.stringify({ type, data })))
      }

      const sendOnData = (event: string, type: string | undefined) => {
        this.bus.on(event, (data) => ws.send(JSON.stringify({ type, data })))
      }
      /* END */

      ws.send(JSON.stringify({ msg: 'Established' }))

      ws.on('message', (message) => {
        try {
          const requestParams: Partial<RequestParams> = JSON.parse(
            message.toString(),
          )
          Logger.info('Websocket received message:', requestParams)

          preRequestControlFlow(requestParams)

          sendOnceData('historical:data', requestParams.type)
          sendOnData('realTime:data', requestParams.type)
          // sendOnceData('realTime:data', requestParams.type)
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
