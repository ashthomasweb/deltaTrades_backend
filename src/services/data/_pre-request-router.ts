import { Logger } from '../../__core/logger'
import { RequestParams } from '../../types/types'
import { historicalActions } from './historical-actions'
import { realTimeActions, RealTimeHandlerRegistry } from './real-time-actions'

export default function preRequestRouter(
  requestParams: Partial<RequestParams>,
) {
  const type = requestParams.type

  switch (type) {
    case 'historical':
      Logger.info('historical preRCF')

      if (requestParams.savedData !== 'none') {
        historicalActions.sendMock(requestParams)
      } else {
        historicalActions.sendRequested(requestParams)
      }
      break

    case 'real-time':
      Logger.info('real-time preRCF')

      if (requestParams.getPrevious === 'on') {
        realTimeActions.sendMockIntervalTick(requestParams)
      } else {
        realTimeActions.sendRequested(requestParams)
      }
      break

    case 'closeRequest':
      Logger.info('close request preRCF')
      RealTimeHandlerRegistry.stop(requestParams.chartId!)

    default:
      break
  }
}
