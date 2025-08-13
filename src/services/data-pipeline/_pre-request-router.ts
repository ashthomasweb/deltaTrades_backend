/**
 * @file src/services/data-pipeline/_pre-request-router.ts
 * @fileoverview Routes incoming request parameters to appropriate backend action handlers before data fetching.
 * 
 * Responsibilities:
 * - Dispatches requests to historical or realTime data fetchers based on request parameters.
 * - Handles special cases such as closing realTime streams or requesting stored/analysis data.
 * 
 * Notes:
 * - This router directs requests before any data fetching or adaptation occurs.
**/

import DebugService from '../debug'
import { AlgoParams, RequestParams } from '@/types'
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
  const type = requestParams.requestType

  if (!type) {
    DebugService.warn(`preRequestRouter called without valid param - 'requestParams.requestType': ${requestParams}`)
    return
  }

  if (!requestParams.algoParams) return

  for (const key of Object.keys(requestParams.algoParams) as Array<keyof AlgoParams>) {
    // ATTN: This may need additional handling if algoParams grows to include more complex data types
    if (!Object.prototype.hasOwnProperty.call(requestParams.algoParams, key)) continue // Defensively pass keys in the prototype chain
    if (key === 'noiseWindow' || key === 'maAvgType') continue // Pass on these keys which need to remain as is from FE
    requestParams.algoParams[key] = +requestParams.algoParams[key]
  }


  switch (type) {
    case 'historical':
      DebugService.trace('Switch - historical')

      historicalActions.sendRequested(requestParams)
      break

    case 'realTime':
      DebugService.trace('Switch - realTime')

      if (requestParams.getPreviousDay === 'on') {
        realTimeActions.sendMockIntervalTick(requestParams)
      } else {
        realTimeActions.sendRequested(requestParams)
      }
      break

    case 'closeRequest':
      DebugService.trace('Switch - closeRequest')

      if (!requestParams.chartId) {
        RealTimeHandlerRegistry.stopAll() // TODO: SYSTEM DESIGN - Evaluate this 'emergency' measure. When would this happen? How would it affect existing positions/analysis?
      }

      RealTimeHandlerRegistry.stop(requestParams.chartId!)
      break

    case 'storedData':
      DebugService.trace('Switch - storedData')

      historicalActions.sendStored(requestParams)
      break

    case 'analysis':
      DebugService.trace('Switch - analysis')

      historicalActions.sendStored(requestParams)
      break

    default:
      DebugService.warn(`Unknown Param - 'type': ${type}`)
      break
  }
}
