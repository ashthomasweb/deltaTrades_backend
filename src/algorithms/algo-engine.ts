/* src/algorithms/algo-engine.ts */
import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import { TransactionPacket, RequestParams } from '../types/types'
import { algo1 } from './algo-test-1'

export class Queue {
  private bus: any
  elements: any
  head: number
  tail: number

  constructor(queue?: any) {
    this.elements = queue ? { ...queue.elements } : {}
    this.head = queue ? queue.head : 0
    this.tail = queue ? queue.tail : 0
    this.bus = EventBus
    this.init()
  }

  init() {
    // let chartId
    this.bus.on('historical:data:queue', (data: TransactionPacket) => {
      Logger.info('AlgoEngine received data\n', 'id:', data.tickerSymbol, data.inputType, ...data.queue.slice(0, 2))
      const algoResult = algo1(data)
      this.bus.emit('algo1Analysis:data', algoResult)
    })
    this.bus.on('realTime:data:queue', (data: TransactionPacket, id: RequestParams['chartId']) => {
      Logger.info('AlgoEngine received data\n', 'id:', id, data.tickerSymbol, data.inputType, ...data.queue.slice(0, 2))
    })
    this.bus.on('analysis:data:queue', (queueData: TransactionPacket, chartData: any, requestParams: any) => {
      Logger.info(
        'AlgoEngine received data\n',
        'id:',
        queueData.tickerSymbol,
        queueData.inputType,
        ...queueData.queue.slice(0, 2),
      )
      const algoResult = algo1(requestParams, queueData)
      this.bus.emit('analysisResults:data', algoResult, chartData)
    })
  }

  enqueue(element: any) {
    this.elements[this.head] = element
    this.head++
  }

  dequeue() {
    const item = this.elements[this.tail]
    delete this.elements[this.tail]
    this.tail++
    return item
  }

  peek() {
    return this.elements[this.tail]
  }

  length(): number {
    return this.head - this.tail
  }

  isEmpty() {
    return this.length() === 0
  }
}

export const queueDataFeeder = (data: any) => {
  // if (data.length > 1) {
  // feed(data[0])
  // } else {
  // setInterval(() => {
  // feed(data)
  // }, 300)
  // }
}
