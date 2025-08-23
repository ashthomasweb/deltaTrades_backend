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

        const engineId = this.createEngineId(requestParams)
        this.startAlgoEngine(engineId, requestParams)
        // const algoResult = algoOutput(requestParams, dataWindow)
        // this.bus.emit('analysisResults:data', algoResult, chartData)
      },
    )
  }

  createEngineId(requestParams: Partial<RequestParams>) {
    DebugService.trace()
    const engineId = `${requestParams.requestType}:${requestParams.symbol || requestParams.requestedStoredDataFilename}:${requestParams.algorithm}@${BUILD_INFO.shortSha}:${requestParams.chartId || 'n/a'}`
    Logger.info('EngineId:', engineId)
    return engineId
  }

  startAlgoEngine(engineId, requestParams) {
    DebugService.trace(null, 'yellow')

    // check to see if existing - clean up if so

    // check requestType - create lookback window flag (realtime vs. analysis = most recent vs. batch)

    // create engine via factory

    // run init on new engine

    // store in registry

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