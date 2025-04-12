import { MockInstance, vi } from 'vitest'
import { EventBus } from '../__core/eventBus'
import { WebSocketServer } from './server'
import { WebSocketServer as WSS, WebSocket } from 'ws'
import { HistoricalService } from '../services/data/historicalService'
import { Logger } from '../__core/logger'

describe('WebSocketServer', () => {
  const eventBus = new EventBus()
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
    vi.spyOn(HistoricalService.prototype, 'fetch').mockImplementation(
      async () => {
        eventBus.emit('historical:data', mockHistoricalData)
      },
    )

    vi.spyOn(console, 'error').mockImplementation(vi.fn())
    vi.spyOn(console, 'log').mockImplementation(vi.fn())
    vi.spyOn(Logger, 'info').mockImplementation(vi.fn())

    server = new WebSocketServer(eventBus)
    await vi.waitFor(() => expect(server.listening).toBe(true))

    client = new WebSocket('ws://localhost:8080')
    await new Promise((resolve) => client.on('open', resolve))
    client.send(JSON.stringify({ type: 'getHistorical' }))
    client.send(JSON.stringify({ type: 'otherRequest' }))
    client.send('invalid message')
  })

  afterEach(() => {
    server.close()
  })

  it('should create a WebSocket server', () => {
    expect(server).toBeDefined()
    expect(Logger.info).toHaveBeenCalledWith(
      'WebSocket server is listening on port 8080',
    )
  })

  it('should listen for client connections', () => {
    expect(wssOn).toHaveBeenCalledWith('connection', expect.any(Function))
  })

  it('should send initial message on client connection', () => {
    expect(wssSend).toHaveBeenCalledWith(JSON.stringify({ msg: 'Established' }))
  })

  it("should respond with historical data on 'getHistorical' message", () => {
    expect(wssSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'historical', data: mockHistoricalData }),
    )
  })

  it("should send price updates to clients on 'price:update' event", () => {
    const priceUpdate = { symbol: 'TSLA', price: 720 }
    eventBus.emit('price:update', priceUpdate)
    expect(wssSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'price', data: priceUpdate }),
    )
  })

  it('should handle invalid client messages gracefully', () => {
    expect(console.error).toHaveBeenCalledWith(
      'Error handling WS message:',
      expect.any(SyntaxError),
    )
  })
})
