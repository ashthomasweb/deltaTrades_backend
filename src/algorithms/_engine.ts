/* src/algorithms/algo-engine.ts */
import { EventEmitter } from 'events'
import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import {
  TransactionPacket,
  Tick as Tick,
  RequestParams,
  ChartData,
  ExtTick,
  NormalizedData,
} from '@/types'
import { algoOutput } from './_output'
import DebugService from '@/services/debug'

export class AlgoEngine {
  private bus: EventEmitter

  constructor() {
    this.bus = EventBus
    this.init()
  }

  init() {
    DebugService.trace()
    // console.log(this)
    
    // this.bus.on(
    //   'realTime:data:queue',
    //   (data: TransactionPacket, id: RequestParams['chartId']) => {
    //     Logger.info(
    //       'AlgoEngine received data\n',
    //       'id:',
    //       id,
    //       data.tickerSymbol,
    //       data.requestType,
    //       ...data.queue.slice(0, 2),
    //     )
    //     // TODO: SYSTEM DESIGN - build out realtime queue logic
    //   },
    // )

    // this.bus.on(
    //   'analysis:data:queue',
    //   (
    //     dataWindow: NormalizedData,
    //     chartData: ChartData,
    //     requestParams: Partial<RequestParams>,
    //   ) => {
    //     Logger.info(
    //       'AlgoEngine received data\n',
    //       'id:',
    //       dataWindow.metaData.tickerSymbol,
    //       dataWindow.metaData.requestType,
    //       ...dataWindow.data.slice(0, 2),
    //     )
    //     const algoResult = algoOutput(requestParams, dataWindow)
    //     this.bus.emit('analysisResults:data', algoResult, chartData)
    //   },
    // )
  }

  dataProcessor() {
    // synchronous flow of step by step process
    // build...
    // extend...
    // runAlgo...
    // conditional packaging (return to FE? Create transaction packet? Paper trade?)
    // conditional output (return to FE? Send to brokerage pipeline? Store in DB?)
  }

  buildSeriesMetrics() {
    // Create analysis metrics that are independent series in the chart (SMA, EMA, BollingerBands)
  }

  extendData() {
    // Accept series metrics for tooltip
    // if (analysis) loop through full batch and extend data
    // if (realTime) accept dayCache data and extend based on latest tick by period // NOTE: future improvement - has many paths
  }

  runAlgoActual() {
    // Accept extended data
    // Run selected Algo, looking for Buy signals
  }

  packageResults() {
    // Accept extendedData and algo results
    // if (buy) create TransactionPacket
    // Package results based on conditions (return to FE, send to brokerage pipeline, paper/live/both, testing, storage)
  }

  output() {
    // Accepts packagedResult
    // emits events based on conditions (return to FE, send to brokerage pipeline, paper/live/both, testing, storage)
  }


  // enqueue(element: Tick | ExtTick) {
  //   if (this.elements) {
  //     this.elements[this.head] = element
  //   }
  //   this.head++
  // }

  // dequeue() {
  //   let item
  //   if (this.elements) {
  //     item = this.elements[this.tail]
  //     delete this.elements[this.tail]
  //   }
  //   this.tail++
  //   return item
  // }

  // peek() {
  //   if (this.elements) {
  //     return this.elements[this.tail]
  //   }
  // }

  // length(): number {
  //   return this.head - this.tail
  // }

  // isEmpty() {
  //   return this.length() === 0
  // }
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
