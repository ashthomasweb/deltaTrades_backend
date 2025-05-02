/* src/services/brokerage/real-time-actions.ts */

import { Logger } from '../../__core/logger'
import postRequestControlFlow from './_post-request-control-flow'
import { marketDataAdapter } from './_market-data-adapter'
import { buildParamString } from '../../utils/api'
import { RequestParams } from '../../types/types'

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

    const realTimeRequest = {
      symbol: requestParams.symbol,
      interval: '1min',
      start: `2025-04-24 15:30`,
      end: `2025-04-25 15:35`,
      session_filter: 'open',
    }

    const paramString = buildParamString(realTimeRequest)

    try {
      const data = await marketDataAdapter.fetchRealtime(paramString)
      postRequestControlFlow(data, requestParams)
    } catch (error) {
      Logger.error(`Realtime fetch failed: ${error}`)
    }
  },
}
