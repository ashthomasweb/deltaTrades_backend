import { Logger } from '@/__core/logger'
import { TransactionPacket, RequestParams, NormalizedData, ChartData, AlgoProcessType, MetaData } from '@/types'
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
  }

  init() {
    DebugService.trace(null, 'red')

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

        const engineId = this.createEngineId(requestParams, dataWindow.metaData)
        this.startAlgoEngine(engineId, requestParams, dataWindow, chartData)
        // const algoResult = algoOutput(requestParams, dataWindow)
        // this.bus.emit('analysisResults:data', algoResult, chartData)
      },
    )
  }

  createEngineId(requestParams: Partial<RequestParams>, requestMetaData: MetaData): string {
    DebugService.trace()
    const engineId = `${requestParams.requestType}:${requestMetaData.tickerSymbol}:${requestParams.dataSource === 'storedData' ? `storedData@${requestParams.requestedStoredDataFilename}` : requestParams.dataSource }:${requestParams.algorithm}@${BUILD_INFO.shortSha}:${requestParams.chartId || 'n/a'}`
    Logger.info('EngineId:', engineId) 
    return engineId
  }

  startAlgoEngine(engineId: string, requestParams: Partial<RequestParams>, dataWindow: NormalizedData, chartData?: any) {
    DebugService.trace(null, 'yellow')

    // check to see if existing - clean up if so
    const existingEngine = AlgoEngineManager.engines.get(engineId)
    if (existingEngine) {
      existingEngine.stopProcess()
      AlgoEngineManager.engines.delete(engineId)
    }

    // check requestType - create lookback window flag (realtime vs. analysis = most recent vs. batch)
    let algoProcessType: AlgoProcessType
    if (requestParams.requestType === 'realTime') {
      algoProcessType = 'most-recent'
    } else if (requestParams.requestType === 'analysis') {
      algoProcessType = 'batch'
    } else {
      Logger.error('Unable to determine handler algoProcessType from request parameters:', requestParams)
      return
    }

    // create engine via factory
    const engine = AlgoEngineFactory.create(algoProcessType, requestParams, dataWindow, chartData)

    // run init on new engine
    engine.init()

    // store in registry
    AlgoEngineManager.engines.set(engineId, engine)

    // log current AlgoEngines
    // Logger.info(`Current Engines:\n`, AlgoEngineManager.engines)
  }

  stopEngine(engineId: string) {
    // TODO: Determine when and why this needs to occur? Auto-garbage collected when server restarts... when to do manually? ever?
    DebugService.trace()

    const engine = AlgoEngineManager.engines.get(engineId)
    if (engine) {
      engine.stopProcess()
      AlgoEngineManager.engines.delete(engineId)
    }
  }

  stopAllEngines() {
    // TODO: Determine when and why this needs to occur? Auto-garbage collected when server restarts... when to do manually? ever?
    DebugService.trace()

    AlgoEngineManager.engines.forEach((engine) => {
      engine.stopProcess()
    })

    AlgoEngineManager.engines.clear()
  }
}

class AlgoEngineFactory {
  static create(processType: AlgoProcessType, requestParams: Partial<RequestParams>, dataWindow: NormalizedData, chartData: any) {
    return new AlgoEngine(processType, requestParams, dataWindow, chartData)
  }
}

export default new AlgoEngineManager()