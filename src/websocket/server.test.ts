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
  let wsServerOn: MockInstance
  let wsServerSend: MockInstance
  const mockHistoricalData = [
    {
      symbol: 'TSLA',
      prices: [700, 705, 710, 715],
    },
  ]

  beforeEach(async () => {
    // Spy on WebSocketServer and WebSocket methods
    wsServerOn = vi.spyOn(WSS.prototype, 'on')
    wsServerSend = vi.spyOn(WebSocket.prototype, 'send')
    vi.spyOn(HistoricalService.prototype, 'fetch').mockImplementation(
      async () => {
        eventBus.emit('historical:data', mockHistoricalData)
      },
    )

    vi.spyOn(console, 'error').mockImplementation(vi.fn())
    vi.spyOn(console, 'log').mockImplementation(vi.fn())
    vi.spyOn(Logger, 'info').mockImplementation(vi.fn())

    server = new WebSocketServer(eventBus)
    await vi.waitFor(() => {
      expect(server.listening).toBe(true)
    })
    client = new WebSocket('ws://localhost:8080')
    await new Promise((resolve) => client.on('open', () => resolve(null)))
    client.send(JSON.stringify({ type: 'getHistorical' }))
    client.send(JSON.stringify({ type: 'otherRequest' }))
    client.send('invalid message')
  })

  afterEach(async () => {
    server.close()
    vi.restoreAllMocks()
  })

  it('should create a WebSocket server', () => {
    expect(server).toBeDefined()
    expect(Logger.info).toHaveBeenCalledWith(
      'WebSocket server is listening on port 8080',
    )
  })

  it('should listen for client connections', () => {
    expect(wsServerOn).toHaveBeenCalledWith('connection', expect.any(Function))
  })

  it('should send initial message on client connection', () => {
    expect(wsServerSend).toHaveBeenCalledWith(
      JSON.stringify({ msg: 'Established' }),
    )
  })

  it("should resond with historical data on 'getHistorical' message", () => {
    expect(wsServerSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'historical', data: mockHistoricalData }),
    )
  })

  it("should send price updates to clients on 'price:update' event", () => {
    const priceUpdate = { symbol: 'TSLA', price: 720 }
    eventBus.emit('price:update', priceUpdate)
    expect(wsServerSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'price', data: priceUpdate }),
    )
  })

  it('should handle errors gracefully', () => {
    expect(console.error).toHaveBeenCalledWith(
      'Error handling WS message:',
      expect.any(SyntaxError),
    )
  })
})
