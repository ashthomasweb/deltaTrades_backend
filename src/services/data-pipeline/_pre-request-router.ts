/**
 * @file src/services/data-pipeline/_pre-request-router.ts
 * @fileoverview Routes incoming request parameters to appropriate backend action handlers before data fetching.
 * 
 * Responsibilities:
 * - Dispatches requests to historical or real-time data fetchers based on request parameters.
 * - Handles special cases such as closing real-time streams or requesting stored/analysis data.
 * 
 * Notes:
 * - This router directs requests before any data fetching or adaptation occurs.
**/

import { Logger } from '../../__core/logger'
import DebugService from '../debug'
import { RequestParams } from '@/types'
import { historicalActions } from './historical-actions'
import { realTimeActions, RealTimeHandlerRegistry } from './real-time-actions'

/**
 * @function preRequestRouter
 * @description Routes incoming request parameters to backend services responsible for initiating data fetching or stream handling.
 * 
 * @param requestParams - Parameters specifying the type of data request and any modifiers.
 */
export default function preRequestRouter(requestParams: Partial<RequestParams>) {
  DebugService.trace()
  const type = requestParams.type

  if (!type) {
    Logger.error('preRequestRouter called without valid requestParams.type', requestParams)
    return
  }

  console.log(requestParams)
  for (const key in requestParams.algoParams) {
    if (key.match(/^noiseWindow$|maAvgType/)) continue
    requestParams.algoParams[key] = +requestParams.algoParams[key]
    console.log(key)
  }
  console.log(requestParams)


  switch (type) {
    case 'historical':
      DebugService.trace('Switch - historical')

      historicalActions.sendRequested(requestParams)
      break

    case 'real-time':
      DebugService.trace('Switch - real-time')

      if (requestParams.getPrevious === 'on') {
        realTimeActions.sendMockIntervalTick(requestParams)
      } else {
        realTimeActions.sendRequested(requestParams)
      }
      break

    case 'closeRequest':
      DebugService.trace('Switch - closeRequest')

      RealTimeHandlerRegistry.stop(requestParams.chartId!) // TODO: Handle case where no chartId is passed
      break

    case 'storedData':
      DebugService.trace('Switch - storedData')
      // TODO: What is this checking?? Shouldn't it always have a selection with this type? Clarify Condition...
      if (requestParams.savedData !== 'none') {
        historicalActions.sendStored(requestParams)
      }
      break

    case 'analysis':
      DebugService.trace('Switch - analysis')

      historicalActions.sendStored(requestParams)
      break

    default:
      Logger.info(`Unknown preRequestRouter type: ${type}`) // TODO: add 'warn' to the Logger and change here.
      break
  }
}
