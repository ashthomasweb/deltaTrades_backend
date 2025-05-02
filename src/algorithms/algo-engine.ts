/* src/algorithms/algo-engine.ts */
import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'

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
    this.bus.on('historical:data:queue', (data: any) => {
      Logger.info('Q received data', data)
    })
    this.bus.on('realTime:data:queue', (data: any) => {
      Logger.info('Q received data', data, data.queue[0])
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
