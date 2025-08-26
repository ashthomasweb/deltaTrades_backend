/**
 * @file src/services/data-pipeline/_post-request-router.ts
 * @fileoverview Routes processed data to appropriate EventBus channels after backend data fetching and formatting.
 * 
 * Responsibilities:
 * - Handles post-processing and distribution of historical, realTime, stored, and analysis data.
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
import { NormalizedData, RequestParams } from '@/types'
import DebugService from '../debug'
import DataCache from '@/__core/data-cache'

/**
 * @function postRequestRouter
 * @description Routes formatted market data to appropriate EventBus events based on request parameters.
 * 
 * @param data - The raw or normalized data to be processed and routed.
 * @param requestParams - Request parameters specifying data type and routing options.
 * @param chartId - Optional chart ID, primarily used for realTime data identification.
 * @param count - Optional count, used for controlling pagination or intervals in realTime requests.
 */
export default function postRequestRouter(
  data: any,
  requestParams: Partial<RequestParams>,
  chartId?: number | string,
  count?: number,
) {
  DebugService.trace()

  const type = requestParams.requestType

  if (!type) {
    DebugService.warn(`postRequestRouter called without valid param - 'requestParams.requestType': ${requestParams}`)
    return
  }

  switch (type) {
    case 'historical': {
      DebugService.trace('Switch - historical')

      const historicalDataAdapter = new DataAdapter(requestParams, data)

      if (requestParams.returnToFE) {
        EventBus.emit('historical:data', historicalDataAdapter.returnFormattedData('chart'))
      }

      if (requestParams.storeRequestedData === 'on') {
        EventBus.emit('historical:data:db', historicalDataAdapter.returnFormattedData('normalized'))
      }
      break
    }

    case 'realTime': {
      DebugService.trace('Switch - realTime')
      Logger.info('count:', count)

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

      if (requestParams.storeRequestedData === 'on') {
        EventBus.emit('realTime:data:db', realTimeDataAdapter.returnFormattedData('normalized'))
      }
      break
    }
     
    // case 'storedData': {
    //   DebugService.trace('Switch - storedData', 'yellow')

    //   const storedDataAdapter = new DataAdapter(requestParams, data)

    //   if (requestParams.returnToFE) {
    //     EventBus.emit('historical:data', storedDataAdapter.returnFormattedData('chart'))
    //   }
    //   break
    // }

    case 'analysis': {
      if (!requestParams.requestedStoredDataFilename) throw Error('No filename passed')
      
      DebugService.trace('Switch - analysis')




      const analysisDataAdapter = new DataAdapter(requestParams, data)

      const normalizedData = analysisDataAdapter.returnNormalizedData() as NormalizedData
      const metaData = normalizedData.metaData
      const chartData = analysisDataAdapter.returnFormattedData('chart')
      const algoProcessType = requestParams.requestType === 'analysis' ? 'batch' : 'most-recent'


      const datasetId = DataCache.createDatasetId(algoProcessType, metaData.dataSource, metaData.tickerSymbol, new Date().toDateString(), metaData.interval, requestParams.requestedStoredDataFilename)
      DataCache.handleNewData(normalizedData, requestParams, algoProcessType, datasetId)

      EventBus.emit(
        'algoEngineManager:analysis', // TODO: There is no queue - bad name
        metaData, // TODO: There is no queue - needs to pass normalized data
        chartData,
        requestParams,
        datasetId
      )
      break
    }

    default:
      DebugService.warn(`Unknown Param - 'type': ${type}`)
      break
  }
}
