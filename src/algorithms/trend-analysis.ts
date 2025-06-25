import { TickArray, RequestParams, Tick } from '../types/types'

type AvgType = 'default' | 'typicalPrice' | 'OHLCAverage'

export const calculateMA = (
  data: TickArray,
  requestParams: Partial<RequestParams>,
): { data: any[]; type: string; smooth: boolean } | undefined => {
  if (!requestParams.algoParams) return // TODO: This is a weak narrowing clause...

  const numOfTicks = requestParams.algoParams.avgPeriod
  const avgType: AvgType = requestParams.algoParams.maAvgType

  const avgTypeFns = {
    default: (tick: Tick) => tick.close,
    typicalPrice: (tick: Tick) => (tick.high + tick.low + tick.close) / 3,
    OHLCAverage: (tick: Tick) => (tick.open + tick.high + tick.low + tick.close) / 4,
  }

  const analysisPacket = {
    data: new Array(data.length).fill(null),
    type: 'line',
    smooth: true,
  }

  for (let i = numOfTicks - 1; i < data.length; i++) {
    const window = data.slice(i - numOfTicks + 1, i + 1)
    const sum = window.reduce((acc, tick) => acc + avgTypeFns[avgType](tick), 0)
    analysisPacket.data[i] = sum / numOfTicks
  }

  return analysisPacket
}
