/* src/services/brokerage/real-time-actions.ts */

import { Logger } from '../../__core/logger'
import postRequestRouter from './_post-request-router'
import { marketDataFetcher } from './_market-data-fetcher'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '@/types'
import { getEastern930Timestamp, getEasternTimestamps } from '../../utils/date-time'

export const realTimeActions = {
  sendMockIntervalTick: async (requestParams: Partial<RequestParams>) => {
    // Logger.info(`realTimeActions sendMockIntervalTick`, requestParams)

    // TODO: normalize the id coming from FE and the registry expected type to string/number.
    RealTimeHandlerRegistry.start(requestParams.chartId?.toString()!, requestParams)
  },
  sendRequested: async (requestParams: Partial<RequestParams>) => {
    // Logger.info('realTimeActions sendRequested', requestParams)

    // TODO: normalize the id coming from FE and the registry expected type to string/number.
    RealTimeHandlerRegistry.start(requestParams.chartId?.toString()!, requestParams)
  },
}

// Handler subclasses must instantiate these methods
interface RequestHandler {
  buildTimestamps(): void
  startCycle(): void
  stopCycle(): void
}

abstract class BaseRequestHandler implements RequestHandler {
  private count: number = 0
  private numberOfRequests: number = 0
  private paramString: string = ''
  protected leadingTimestamp: string = ''
  protected backFilledStart?: string
  protected intervalId: ReturnType<typeof setInterval> | null = null
  protected requestParams: Partial<RequestParams> = {}

  constructor(requestParams: Partial<RequestParams>) {
    this.requestParams = requestParams
  }

  abstract buildTimestamps(): void

  abstract startCycle(): void

  stopCycle() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private buildTradierParams() {
    const result = {
      symbol: this.requestParams.symbol,
      interval: '1min',
      start: this.count === 0 ? this.backFilledStart : this.leadingTimestamp,
      end: this.leadingTimestamp,
      session_filter: 'open',
    }

    this.paramString = buildParamString(result)
  }

  async handleRequest() {
    this.buildTimestamps()
    this.buildTradierParams()
    try {
      const data = await marketDataFetcher.fetchRealtime(this.paramString)
      postRequestRouter(data, this.requestParams, this.requestParams.chartId, this.getCount())
      if (this.getCount() === 0) {
        this.setCount(data.series.data.length - 1)
      }
    } catch (error) {
      Logger.error(`Realtime fetch failed: ${error}`)
    }

    this.increment()
  }

  private increment() {
    this.count++
    this.numberOfRequests++
  }

  private setCount(input: number) {
    this.count = input
  }

  private getCount() {
    return this.count
  }

  getRequests() {
    return this.numberOfRequests
  }
}

// Subclass for true 'RealTime' requests
class RealTimeRequestHandler extends BaseRequestHandler {
  buildTimestamps() {
    this.leadingTimestamp = getEasternTimestamps(new Date())[0]
    this.backFilledStart =
      this.requestParams.backfill !== null
        ? getEastern930Timestamp(new Date().toISOString(), this.requestParams.backfill)
        : this.leadingTimestamp
  }

  startCycle() {
    const currentSeconds = new Date().getSeconds() * 1000
    const APIUpdateBuffer = 4000

    this.handleRequest() // Call on initial request
    setTimeout(
      async () => {
        this.handleRequest() // Call at bottom of next minute + buffer length
        this.intervalId = setInterval(async () => {
          this.handleRequest() // Call every 60 seconds afterwards (includes buffer)
        }, 60000)
      },
      60000 - currentSeconds + APIUpdateBuffer,
    )
  }
}

// Subclass for Tradier 'previousDay' requests
class PreviousDayRequestHandler extends BaseRequestHandler {
  buildTimestamps() {
    const requestParamIsEasternTime = true
    this.leadingTimestamp = getEasternTimestamps(
      new Date(this.requestParams.beginDate!),
      this.getRequests(),
      requestParamIsEasternTime,
    )[1]

    this.backFilledStart =
      this.requestParams.backfill !== null
        ? getEastern930Timestamp(this.requestParams.beginDate!, this.requestParams.backfill)
        : this.requestParams.beginDate
  }

  // Previous day requests don't need the 'bottom of the minute' logic at this time.
  // Accepts an interval length for adding to the chart
  startCycle(mockIntervalInMs: number = 3000) {
    this.handleRequest() // Call on initial request
    this.intervalId = setInterval(async () => {
      this.handleRequest() // Call at passed interval afterwards
    }, mockIntervalInMs)
  }
}

// TODO: Across app standardize terms such as 'realTime vs. real-time', 'previousDay vs. getPrevious' ...
type HandlerTypes = 'realTime' | 'previousDay' | undefined

class RequestHandlerFactory {
  static create(type: HandlerTypes, params: Partial<RequestParams>): RequestHandler {
    switch (type) {
      case 'realTime':
        return new RealTimeRequestHandler(params)

      case 'previousDay':
        return new PreviousDayRequestHandler(params)

      default:
        throw new Error(`Handler type: ${type} not defined.`)
    }
  }
}

/**
 * Used in the creation/destruction of independent request handlers.
 * Enables multiple charts to run simultaneously and be controlled independently.
 *  Calls Factory based on params.
 *
 */
export class RealTimeHandlerRegistry {
  private static handlers: Map<string, RequestHandler> = new Map()

  // Start or replace a handler for a given chart ID
  static start(chartId: string, params: Partial<RequestParams>) {
    // If existing → stop and remove it
    const existingHandler = this.handlers.get(chartId)
    if (existingHandler) {
      existingHandler.stopCycle()

      this.handlers.delete(chartId)
    }

    // Create new handler // TODO: Clean this up - could be more elegant - will bloat if more handlers are added
    let type: HandlerTypes
    if (params.getPrevious === 'on') {
      type = 'previousDay'
    } else if (params.getPrevious === null) {
      type = 'realTime'
    }
    const handler = RequestHandlerFactory.create(type, params)
    handler.startCycle()

    // Store in registry
    this.handlers.set(chartId, handler)
  }

  // Stop and remove a handler by chart ID
  static stop(chartId: string) {
    const handler = this.handlers.get(chartId)
    if (handler) {
      handler.stopCycle()
      this.handlers.delete(chartId)
    }
  }

  // Stop all handlers
  static stopAll() {
    this.handlers.forEach((handler) => {
      handler.stopCycle()
    })

    this.handlers.clear()
  }

  // Check if handler exists for chart
  static has(chartId: string): boolean {
    return this.handlers.has(chartId)
  }
}
