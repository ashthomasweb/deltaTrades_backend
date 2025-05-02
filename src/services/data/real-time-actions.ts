/* src/services/brokerage/real-time-actions.ts */

import { Logger } from '../../__core/logger'
import postRequestControlFlow from './_post-request-control-flow'
import { marketDataAdapter } from './_market-data-adapter'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '../../types/types'
import { request } from 'express'

export const realTimeActions = {
  sendMockIntervalTick: (requestParams: Partial<RequestParams>) => {
    Logger.info(`realTimeActions sendMockIntervalTick`)

    for (let i = 0; i < 10; i++) {
      const realTimeRequest = {
        symbol: requestParams.symbol,
        interval: '1min',
        start: `2025-04-25 15:0${i.toString()}`,
        end: `2025-04-25 15:0${i.toString()}`,
        session_filter: 'open',
      }

      const paramString = buildParamString(realTimeRequest)

      setTimeout(async () => {
        try {
          const data = await marketDataAdapter.fetchRealtime(paramString)
          postRequestControlFlow(data, requestParams)
        } catch (error) {
          Logger.error(`Realtime fetch failed: ${error}`)
        }
      }, i * 2000)
    }
  },
  sendRequested: async (requestParams: Partial<RequestParams>) => {
    Logger.info('realTimeActions sendRequested')

    let count = 0

    const currentSeconds = new Date().getSeconds() * 1000
    const APIUpdateBuffer = 4000

    function getEasternTimeTimestamps(subtractHours?: number) {
      const now = new Date()

      // Use Intl.DateTimeFormat with America/New_York to get EST/EDT time
      const format = (date: Date) => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })

        const parts = formatter.formatToParts(date)
        const lookup = (type: string) =>
          parts.find((p) => p.type === type)?.value

        return `${lookup('year')}-${lookup('month')}-${lookup('day')} ${lookup('hour')}:${lookup('minute')}`
      }

      const oneMinuteAgo = new Date(
        subtractHours !== undefined
          ? now.getTime() - 60 * 1000 - 60 * 1000 * 60 * subtractHours
          : now.getTime() - 60 * 1000,
      )
      const rightNow = new Date(
        subtractHours !== undefined
          ? now.getTime() - 60 * 1000 * 60 * subtractHours
          : now,
      )

      return [format(oneMinuteAgo), format(rightNow)]
    }

    async function makeRequest(requestParams: Partial<RequestParams>) {
      const [pastTimestamp, currentTimestamp] = getEasternTimeTimestamps(5)

      const realTimeRequest = {
        symbol: requestParams.symbol,
        interval: '1min',
        start: currentTimestamp,
        end: currentTimestamp,
        session_filter: 'open',
      }

      const paramString = buildParamString(realTimeRequest)
      console.log(realTimeRequest)

      try {
        const data = await marketDataAdapter.fetchRealtime(paramString)
        postRequestControlFlow(data, requestParams, count)
      } catch (error) {
        Logger.error(`Realtime fetch failed: ${error}`)
      }
      count++
    }

    makeRequest(requestParams) // Call on initial request
    setTimeout(
      async () => {
        makeRequest(requestParams) // Call at bottom of next minute + buffer length
        setInterval(async () => {
          makeRequest(requestParams) // Call every 60 seconds afterwards (includes buffer)
        }, 60000)
      },
      60000 - currentSeconds + APIUpdateBuffer,
    )
  },
}
