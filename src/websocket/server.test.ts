/* src/websocket/server.test.ts */
/* eslint-env node, vitest */

import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import { historicalActions } from '../services/data/historical-actions'
import { WebSocketServer } from './server'
import { MockInstance, vi } from 'vitest'
import { WebSocketServer as WSS, WebSocket } from 'ws'

describe('WebSocketServer', () => {
  const eventBus = EventBus
  let server: WebSocketServer
  let client: WebSocket
  let wssOn: MockInstance
  let wssSend: MockInstance
  const mockHistoricalData = [
    {
      symbol: 'TSLA',
      prices: [700, 705, 710, 715],
    },
  ]

  beforeEach(async () => {
    wssOn = vi.spyOn(WSS.prototype, 'on')
    wssSend = vi.spyOn(WebSocket.prototype, 'send')
    vi.spyOn(historicalActions, 'sendStored').mockImplementation(async () => {
      eventBus.emit('historical:data', mockHistoricalData)
    })
    vi.spyOn(historicalActions, 'sendRequested').mockImplementation(async () => {
      eventBus.emit('historical:data', mockHistoricalData)
    })

    vi.spyOn(console, 'error').mockImplementation(vi.fn())
    vi.spyOn(console, 'log').mockImplementation(vi.fn())
    vi.spyOn(Logger, 'info').mockImplementation(vi.fn())

    server = new WebSocketServer()
    await vi.waitFor(() => expect(server.listening).toBe(true))

    client = new WebSocket('ws://localhost:8080')
    await new Promise((resolve) => client.on('open', resolve))
    // client.send(JSON.stringify({ type: 'historical' }))
    // client.send(JSON.stringify({ type: 'realtime' }))
    // client.send('invalid message')
  })

  afterEach(() => {
    server.close()
  })

  it('should create a WebSocket server', () => {
    expect(server).toBeDefined()
    expect(Logger.info).toHaveBeenCalledWith('WebSocket server is listening on port 8080')
  })

  it('should listen for client connections', () => {
    expect(wssOn).toHaveBeenCalledWith('connection', expect.any(Function))
  })

  it('should send initial message on client connection', () => {
    expect(wssSend).toHaveBeenCalledWith(JSON.stringify({ msg: 'Established' }))
  })

  it('should broadcast historical data when historical:data event is emitted', async () => {
    const message = { type: 'historical', data: mockHistoricalData }

    // Manually emit the event
    eventBus.emit('historical:data', mockHistoricalData)

    // Wait for the send to be triggered
    await vi.waitFor(() => {
      expect(wssSend).toHaveBeenCalledWith(JSON.stringify(message))
    })
  })

  it('should broadcast realTime data when realTime:data event is emitted', async () => {
    const mockRealTimeData = [{ symbol: 'TSLA', price: 270 }]
    const mockId = 42
    const expectedMessage = JSON.stringify({ type: 'realTime', data: mockRealTimeData, id: mockId })

    eventBus.emit('realTime:data', mockRealTimeData, mockId)

    await vi.waitFor(() => {
      expect(wssSend).toHaveBeenCalledWith(expectedMessage)
    })
  })

  it('should handle invalid client messages gracefully', async () => {
    client.send('bad json')
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error handling WS message:', expect.any(SyntaxError))
    })
  })
})
