/* src/algorithms/algo-engine.ts */
import { EventEmitter } from 'events'
import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import {
  TransactionPacket,
  Tick as Tick,
  RequestParams,
  ChartData,
  QueueType,
  ExtTick,
} from '@/types'
import { algoOutput } from './_output'

export class Queue {
  private bus: EventEmitter
  elements: Tick[] | ExtTick[] | null
  head: number
  tail: number

  constructor(queue?: QueueType) {
    this.elements = queue ? queue.elements : null
    this.head = queue ? queue.head : 0
    this.tail = queue ? queue.tail : 0
    this.bus = EventBus
    this.init()
  }

  init() {
    this.bus.on(
      'realTime:data:queue',
      (data: TransactionPacket, id: RequestParams['chartId']) => {
        Logger.info(
          'AlgoEngine received data\n',
          'id:',
          id,
          data.tickerSymbol,
          data.inputType,
          ...data.queue.slice(0, 2),
        )
        // TODO: build out realtime queue logic
      },
    )

    this.bus.on(
      'analysis:data:queue',
      (
        queueData: TransactionPacket,
        chartData: ChartData,
        requestParams: Partial<RequestParams>,
      ) => {
        Logger.info(
          'AlgoEngine received data\n',
          'id:',
          queueData.tickerSymbol,
          queueData.inputType,
          ...queueData.queue.slice(0, 2),
        )
        const algoResult = algoOutput(requestParams, queueData)
        this.bus.emit('analysisResults:data', algoResult, chartData)
      },
    )
  }

  enqueue(element: Tick | ExtTick) {
    if (this.elements) {
      this.elements[this.head] = element
    }
    this.head++
  }

  dequeue() {
    let item
    if (this.elements) {
      item = this.elements[this.tail]
      delete this.elements[this.tail]
    }
    this.tail++
    return item
  }

  peek() {
    if (this.elements) {
      return this.elements[this.tail]
    }
  }

  length(): number {
    return this.head - this.tail
  }

  isEmpty() {
    return this.length() === 0
  }
}

export const queueDataFeeder = (data: unknown) => {
  // if (data.length > 1) {
  // feed(data[0])
  // } else {
  // setInterval(() => {
  // feed(data)
  // }, 300)
  // }
}
