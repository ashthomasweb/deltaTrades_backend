import DataAdapter from '../data-adapter'
import EventBus from '../../__core/event-bus'
import { Logger } from '../../__core/logger'
import { RequestParams } from '../../types/types'

export default function postRequestControlFlow(
  data: any,
  requestParams: Partial<RequestParams>,
) {
  const type = requestParams.type

  switch (type) {
    case 'historical':
      Logger.info('Historical postRCF')

      const historicalDataAdapter = new DataAdapter(requestParams, data)

      if (requestParams.returnToFE) {
        EventBus.emit(
          'historical:data',
          historicalDataAdapter.returnFormattedData('chart'),
        )
      }

      if (requestParams.sendToQueue === 'on') {
        EventBus.emit(
          'historical:data:queue',
          historicalDataAdapter.returnFormattedData('queue'),
        )
      }

      if (requestParams.storeData === 'on') {
        EventBus.emit(
          'historical:data:db',
          historicalDataAdapter.returnFormattedData('normalized'),
        )
      }
      break

    case 'real-time':
      Logger.info('RealTime postRCF')

      const options = {
        tickerSymbol: requestParams.symbol,
        interval: requestParams.interval,
      }
      const realTimeDataAdapter = new DataAdapter(requestParams, data, options)

      if (requestParams.returnToFE) {
        EventBus.emit(
          'realTime:data',
          realTimeDataAdapter.returnFormattedData('chart'),
        )
      }

      if (requestParams.sendToQueue === 'on') {
        EventBus.emit(
          'realTime:data:queue',
          realTimeDataAdapter.returnFormattedData('queue'),
        )
      }

      if (requestParams.storeData === 'on') {
        EventBus.emit(
          'realTime:data:db',
          realTimeDataAdapter.returnFormattedData('normalized'),
        )
      }
      break

    default:
      break
  }
}
