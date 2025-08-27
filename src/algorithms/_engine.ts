/* src/algorithms/algo-engine.ts */
import { EventEmitter } from 'events'
import EventBus from '../__core/event-bus'
import { Logger } from '../__core/logger'
import {
  RequestParams,
  AlgoProcessType,
  ChartDataShape,
} from '@/types'
import DebugService from '@/services/debug'
import DataCache from '@/__core/data-cache'

export class AlgoEngine {
  private bus: EventEmitter
  private processType: AlgoProcessType
  private requestParams: Partial<RequestParams>
  private chartData: ChartDataShape
  private datasetId: string
  private engineId: string

  constructor(processType: AlgoProcessType, requestParams: Partial<RequestParams>, chartData: ChartDataShape, datasetId: string, engineId: string) {
    this.bus = EventBus
    this.processType = processType
    this.chartData = chartData
    this.requestParams = requestParams
    this.datasetId = datasetId
    this.engineId = engineId
  }

  init() {
    DebugService.trace(null, 'red')
    console.log('processType', this.processType)
    console.log('params', this.requestParams)
    console.log('chartData ', this.chartData ? 'present' : 'missing')
    console.log('datasetId', this.datasetId)
    console.log('engineId', this.engineId)
    this.dataProcessor()
  }

  // synchronous flow of step by step process
  dataProcessor() {
    DebugService.trace()

    // get from DataCache...
    const data = DataCache.provideDataset(this.datasetId)
    Logger.info(data)

    // build...
    this.buildSeriesMetrics()

    // extend...
    this.extendData()

    // runAlgo...
    this.runAlgoActual()

    // conditional packaging (return to FE? Create transaction packet? Paper trade?)
    this.packageResults()

    // conditional output (return to FE? Send to brokerage pipeline? Store in DB?)
    this.output()
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

  stopProcess() {

  }


}





/* Retired? */
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

// export const queueDataFeeder = (data: unknown) => {
//   if (data.length > 1) {
//     feed(data[0])
//   } else {
//     setInterval(() => {
//       feed(data)
//     }, 300)
//   }
// }

/* END */

