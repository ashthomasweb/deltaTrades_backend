import { Logger } from '../../__core/logger'
import { RequestParams } from '../../types/types'
import { historicalActions } from './historical-actions'
import { realTimeActions, RealTimeHandlerRegistry } from './real-time-actions'

export default function preRequestRouter(requestParams: Partial<RequestParams>) {
  const type = requestParams.type

  switch (type) {
    case 'historical':
      // Logger.info('historical preRequestRouter')
      historicalActions.sendRequested(requestParams)
      break

    case 'real-time':
      // Logger.info('real-time preRequestRouter')
      if (requestParams.getPrevious === 'on') {
        realTimeActions.sendMockIntervalTick(requestParams)
      } else {
        realTimeActions.sendRequested(requestParams)
      }
      break

    case 'closeRequest':
      // Logger.info('close request preRequestRouter')
      RealTimeHandlerRegistry.stop(requestParams.chartId!)
      break

    case 'storedData':
      if (requestParams.savedData !== 'none') {
        historicalActions.sendStored(requestParams)
      }
      break

    case 'analysis':
      historicalActions.sendStored(requestParams)
      break

    default:
      break
  }
}
