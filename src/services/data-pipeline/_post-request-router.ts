/**
 * @file src/services/data-pipeline/_post-request-router.ts
 * @fileoverview Routes processed data to appropriate EventBus channels after backend data fetching and formatting.
 * 
 * Responsibilities:
 * - Handles post-processing and distribution of historical, real-time, stored, and analysis data.
 * - Formats incoming data using DataAdapter.
 * - Emits formatted data to EventBus channels for further processing or frontend delivery.
 * 
 * Notes:
 * - This router runs after data has been fetched and run through the DataAdapter.
 * - Does not perform data fetching; solely responsible for post-fetch routing and dispatching.
**/

import DataAdapter from '../data-adapter/data-adapter'
import EventBus from '../../__core/event-bus'
import { Logger } from '../../__core/logger'
import { RequestParams } from '@/types'

/**
 * @function postRequestRouter
 * @description Routes formatted market data to appropriate EventBus events based on request parameters.
 * 
 * @param data - The raw or normalized data to be processed and routed.
 * @param requestParams - Request parameters specifying data type and routing options.
 * @param chartId - Optional chart ID, primarily used for real-time data identification.
 * @param count - Optional count, used for controlling pagination or intervals in real-time requests.
 */
export default function postRequestRouter(
  data: any,
  requestParams: Partial<RequestParams>,
  chartId?: number | string,
  count?: number,
) {
  const type = requestParams.type

  if (!type) {
    Logger.error('postRequestRouter called without valid requestParams.type', requestParams)
    return
  }

  switch (type) {
    case 'historical': {
      Logger.info('Historical postRequestRouter') // TODO: Change these to the new DebugService.trace()

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
      Logger.info('RealTime postRequestRouter', count) // TODO: Change these to the new DebugService.trace()
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
      Logger.info('StoredData postRequestRouter', count) // TODO: Change these to the new DebugService.trace()
      const storedDataAdapter = new DataAdapter(requestParams, data)

      if (requestParams.returnToFE) {
        EventBus.emit('historical:data', storedDataAdapter.returnFormattedData('chart'))
      }
      break
    }

    case 'analysis': {
      Logger.info('AnalysisData postRequestRouter') // TODO: Change these to the new DebugService.trace()
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
      Logger.info(`Unknown postRequestRouter type: ${type}`) // TODO: add 'warn' to the Logger and change here.
      break
  }
}
