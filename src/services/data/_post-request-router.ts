import DataAdapter from '../data-adapter'
import EventBus from '../../__core/event-bus'
import { Logger } from '../../__core/logger'
import { RequestParams } from '../../types/types'

export default function postRequestRouter(
  data: any,
  requestParams: Partial<RequestParams>,
  chartId?: number | string,
  count?: number,
) {
  const type = requestParams.type

  switch (type) {
    case 'historical': {
      Logger.info('Historical postRequestRouter')

      const historicalDataAdapter = new DataAdapter(requestParams, data)

      if (requestParams.returnToFE) {
        EventBus.emit('historical:data', historicalDataAdapter.returnFormattedData('chart'))
      }

      if (requestParams.storeData === 'on') {
        EventBus.emit('historical:data:db', historicalDataAdapter.returnFormattedData('normalized'))
      }
      break
    }

    case 'real-time': {
      Logger.info('RealTime postRequestRouter', count)
      const options = {
        tickerSymbol: requestParams.symbol,
        interval: requestParams.interval,
        count,
      }
      const realTimeDataAdapter = new DataAdapter(requestParams, data, options)

      if (requestParams.returnToFE) {
        EventBus.emit('realTime:data', realTimeDataAdapter.returnFormattedData('chart'), chartId)
      }

      if (requestParams.sendToQueue === 'on') {
        EventBus.emit('realTime:data:queue', realTimeDataAdapter.returnFormattedData('queue'), chartId)
      }

      if (requestParams.storeData === 'on') {
        EventBus.emit('realTime:data:db', realTimeDataAdapter.returnFormattedData('normalized'))
      }
      break
    }

    case 'storedData': {
      Logger.info('StoredData postRequestRouter', count)
      const storedDataAdapter = new DataAdapter(requestParams, data)

      if (requestParams.returnToFE) {
        // TODO: Problematic - sending an event each creates a double render cycle on the frontend,
        // breaking user-selected chart state (zoom) persistence
        EventBus.emit('historical:data', storedDataAdapter.returnFormattedData('chart'))
      }
      break
    }

    case 'analysis': {
      Logger.info('AnalysisData postRequestRouter')
      const analysisDataAdapter = new DataAdapter(requestParams, data)
      EventBus.emit(
        'analysis:data:queue',
        analysisDataAdapter.returnFormattedData('queue'),
        analysisDataAdapter.returnFormattedData('chart'),
        requestParams,
      )
      break
    }

    case 'analysis': {
      Logger.info('AnalysisData postRequestRouter')
      const analysisDataAdapter = new DataAdapter(requestParams, data)
      EventBus.emit(
        'analysis:data:queue',
        analysisDataAdapter.returnFormattedData('queue'),
        analysisDataAdapter.returnFormattedData('chart'),
        requestParams,
      )
      break
    }

    default:
      break
  }
}
