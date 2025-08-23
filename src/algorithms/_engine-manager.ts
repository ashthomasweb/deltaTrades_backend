import { Logger } from '@/__core/logger'
import { TransactionPacket, RequestParams, NormalizedData, ChartData } from '@/types'
import DebugService from '../services/debug'
import { algoOutput } from './_output'
import { EventEmitter } from 'events'
import EventBus from '../__core/event-bus'
import { AlgoEngine } from './_engine'
import { BUILD_INFO } from '@/__core/build-info'



class AlgoEngineManager {
  private bus: EventEmitter
  private static engines: Map<string, AlgoEngine> = new Map()


  constructor() {
    this.bus = EventBus

    // this.init()
    // console.log('aem init')
  }

  init() {
    DebugService.trace(null, 'red')

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

    //     this.createEngineId(requestParams)

    //   },
    // )

    this.bus.on(
      'analysis:data:queue',
      (
        dataWindow: NormalizedData,
        chartData: ChartData,
        requestParams: Partial<RequestParams>,
      ) => {
        Logger.info(
          'AlgoEngine received data\n',
          'id:',
          dataWindow.metaData.tickerSymbol,
          dataWindow.metaData.requestType,
          ...dataWindow.data.slice(0, 1),
        )

        this.createEngineId(requestParams)

        // const algoResult = algoOutput(requestParams, dataWindow)
        // this.bus.emit('analysisResults:data', algoResult, chartData)
      },
    )
  }

  createEngineId(requestParams: Partial<RequestParams>) {
    DebugService.trace(null, 'yellow')
    console.log(requestParams.requestType)
    console.log(requestParams.chartId)
    console.log(BUILD_INFO)
    const codeId = ``
    console.log(`${requestParams.requestType}:${requestParams.symbol}:${requestParams.chartId}`)
  }

  startAlgoEngine(engineId, requestParams) {

  }

  stopEngine(engineId) {

  }

  stopAllEngines() {

  }
}

class AlgoEngineFactory {
  static create(engineId) {

  }
}

export default new AlgoEngineManager()