/**
 * @file src/services/brokerage/realTime-actions.ts
 * @fileoverview Manages realTime and previous-day request cycles for market data.
 *
 * Defines handler classes to manage polling behavior, encapsulates timing logic,
 * and registers handlers per chart instance to allow independent updates.
**/

import { Logger } from '../../__core/logger'
import postRequestRouter from './_post-request-router'
import { marketDataFetcher } from './_market-data-fetcher'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '@/types'
import { getEastern930Timestamp, getEasternTimestamps } from '../../utils/date-time'
import DebugService from '../debug'

/**
 * @namespace realTimeActions
 * @description External interface for initiating mock or requested realTime polling cycles.
 */
export const realTimeActions = {
  sendMockIntervalTick: async (requestParams: Partial<RequestParams>) => {
    DebugService.trace()
    Logger.info(`realTimeActions sendMockIntervalTick`, requestParams)

    RealTimeHandlerRegistry.start(requestParams.chartId?.toString()!, requestParams)
  },
  sendRequested: async (requestParams: Partial<RequestParams>) => {
    Logger.info('realTimeActions sendRequested', requestParams)

    RealTimeHandlerRegistry.start(requestParams.chartId?.toString()!, requestParams)
  },
}

/**
 * @interface RequestHandler
 * @description Standard interface implemented by all request handler types. Handler must implement these methods.
 */
interface RequestHandler {
  buildTimestamps(): void
  startCycle(): void
  stopCycle(): void
}

/**
 * @abstract
 * @class BaseRequestHandler
 * @description Provides shared lifecycle and request logic for polling data from Tradier.
 */
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

  /**
   * @function buildTradierParams
   * @description Constructs the query string for the Tradier API based on the current state 
   * of the request. Includes symbol, interval, start and end timestamps, and session filtering. 
   * Stores the result internally for use in data requests.
   */
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

  /**
   * @function handleRequest
   * @description Initiates a single request to the data API and dispatches the result via the postRequestRouter.
   * Tracks internal request count.
   */
  async handleRequest() {
    this.buildTimestamps()
    this.buildTradierParams()
    try {
      const data = await marketDataFetcher.fetchRealtime(this.paramString)
      postRequestRouter(data, this.requestParams, this.requestParams.chartId, this.getCount())
      if (this.getCount() === 0) {
        this.setCount([data.series.data].length - 1) // TODO fix type // TODO check solution
      }
    } catch (error) {
      Logger.error(`Realtime fetch failed: ${error}`)
    }

    this.increment()
  }

  /**
   * @function increment
   * @description Increments the internal counters tracking request count and data offset 
   * position. Used after each successful or attempted API request.
   */
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

  /**
   * @function getRequests
   * @description Returns the number of requests made by the handler so far. Primarily used
   * by timestamp logic to determine offset.
   * 
   * @returns The current request count.
   */
  getRequests(): number {
    return this.numberOfRequests
  }
}

/**
 * @class RealTimeRequestHandler
 * @description Handles realTime polling using buffer-based scheduling around market ticks.
 */
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
    const APIUpdateBuffer = 4000 // Wait 4s past the top of the minute to ensure data availability

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

/**
 * @class PreviousDayRequestHandler
 * @description Handles mock-interval polling for historical data using beginDate and backfill params.
 */
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

type HandlerTypes = 'realTime' | 'getPreviousDay' | undefined

/**
 * @class RequestHandlerFactory
 * @description Factory for instantiating request handlers based on request type.
 */
class RequestHandlerFactory {
  static create(realTimeRequestType: HandlerTypes, params: Partial<RequestParams>): RequestHandler {
    switch (realTimeRequestType) {
      case 'realTime':
        return new RealTimeRequestHandler(params)

      case 'getPreviousDay':
        return new PreviousDayRequestHandler(params)

      default:
        throw new Error(`Handler realTimeRequestType: ${realTimeRequestType} not defined.`)
    }
  }
}

/**
 * @class RealTimeHandlerRegistry
 * @description Manages active data request cycles per chart instance. Allows for independent stream control.
 *
 * Responsibilities:
 * - Start/stop handlers based on chart ID
 * - Create handlers via the factory based on request parameters
 * - Prevent duplicate handlers for the same chart
 */
export class RealTimeHandlerRegistry {
  private static handlers: Map<string, RequestHandler> = new Map()

  // Start or replace a handler for a given chart ID
  static start(chartId: string, params: Partial<RequestParams>) {
    DebugService.trace()

    // If existing → stop and remove it
    const existingHandler = this.handlers.get(chartId)
    if (existingHandler) {
      existingHandler.stopCycle()

      this.handlers.delete(chartId)
    }

    // Create new handler
    let realTimeRequestType: HandlerTypes
    if (params.getPreviousDay === 'on') {
      realTimeRequestType = 'getPreviousDay'
    } else if (params.getPreviousDay === null) {
      realTimeRequestType = 'realTime'
    } else {
      Logger.error('Unable to determine handler realTimeRequestType from request parameters:', params)
      return
    }

    const handler = RequestHandlerFactory.create(realTimeRequestType, params)
    handler.startCycle()

    // Store in registry
    this.handlers.set(chartId, handler)
  }

  // Stop and remove a handler by chart ID
  static stop(chartId: string) {
    DebugService.trace()

    const handler = this.handlers.get(chartId)
    if (handler) {
      handler.stopCycle()
      this.handlers.delete(chartId)
    }
  }

  // Stop all handlers
  static stopAll() {
    DebugService.trace()

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
