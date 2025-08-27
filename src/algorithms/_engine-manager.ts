import { Logger } from '@/__core/logger'
import { RequestParams, AlgoProcessType, MetaData, ChartDataShape } from '@/types'
import DebugService from '../services/debug'
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
      'algoEngineManager:analysis',
      (
        metaData: MetaData,
        chartData: ChartDataShape,
        requestParams: Partial<RequestParams>,
        datasetId: string
      ) => {
        Logger.info(
          'AlgoEngine received data\n',
          'id:',
          metaData.tickerSymbol,
          metaData.requestType,
        )
        
        const engineId = this.createEngineId(requestParams, metaData)
        this.startAlgoEngine(engineId, requestParams, datasetId, chartData)
      },
    )
  }

  createEngineId(requestParams: Partial<RequestParams>, requestMetaData: MetaData): string {
    DebugService.trace()
    const engineId = `${requestParams.requestType}:${requestMetaData.tickerSymbol}:${requestParams.dataSource === 'storedData' ? `storedData@${requestParams.requestedStoredDataFilename}` : requestParams.dataSource }:${requestParams.algorithm}@${BUILD_INFO.shortSha}:${requestParams.chartId || 'n/a'}`
    return engineId
  }

  startAlgoEngine(engineId: string, requestParams: Partial<RequestParams>, datasetId: string, chartData?: ChartDataShape,) {
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
    const engine = AlgoEngineFactory.create(algoProcessType, requestParams, chartData, datasetId, engineId)

    // run init on new engine
    engine.init()

    // store in registry
    AlgoEngineManager.engines.set(engineId, engine)

    // log current AlgoEngines
    Logger.info(`Current Engines:\n`, AlgoEngineManager.engines)
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
  static create(processType: AlgoProcessType, requestParams: Partial<RequestParams>, chartData: ChartDataShape, datasetId: string, engineId: string) {
    return new AlgoEngine(processType, requestParams, chartData, datasetId, engineId)
  }
}

export default new AlgoEngineManager()