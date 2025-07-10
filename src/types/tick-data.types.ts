export interface NormalizedData {
  id: number
  creationMeta: CreationMeta
  metaData: MetaData
  data: Tick[]
}

export interface CreationMeta {
  createdAtUTC: string
  createdAtLocal: string
  localTimezone: string
}

export interface MetaData {
  tickerSymbol: string
  interval: string
  inputType: 'historical' | 'real-time'
  inputSource: 'AlphaVantage' | 'Tradier'
  originator: 'frontend' | 'backend' | 'emergency'
  historicalMeta?: {
    datasetSize: 'compact' | 'full'
    endDate: string
    beginDate: string
  }
  realTimeMeta?: {
    endDate: string
    beginDate: string
  }
}

export interface Tick {
  timestamp: string | undefined
  open: number
  close: number
  high: number
  low: number
  volume: number
  percentChange?: number | null
  absoluteChange?: number | null
  vwap?: number | null
}

export interface ExtTick extends Tick {
  originalIndex: number | undefined
  isPrevGreen: boolean | null
  isGreen: boolean
  isNextGreen: boolean | null
  movingAvg: number | undefined
  shortEmaAvg: number | undefined
  longEmaAvg: number | undefined
  emaCrossing: {
    crossing: boolean | undefined
    direction: 'bullish' | 'bearish' | undefined
  }
  bollingerBreakout: boolean
  isBodyCrossing: boolean | undefined
  isWickCrossing: boolean | undefined
  bearishEngulfingScore: number | null
  isBullishExhaustion: boolean | null
  crossesBodyAtPercent?: number | null
  isCandleFull80: boolean
  candleBodyFullness: number
  candleBodyDistPercentile: number | undefined
  candleVolumeDistPercentile: number | undefined
  volumeTrendIncreasing: number | null
  value: [string | undefined, null]
  percSlopeByPeriod: number | null
  priceSlopeByPeriod: number | null
  smaSlopeByPeriod: number | null
  emaSlopeByPeriod: number | null
}

export type TickArray = Tick[] | ExtTick[]

// export type Tick = {
//   timestamp: string
//   open: number
//   close: number
//   high: number
//   low: number
//   volume: number
//   percentChange: number
//   absoluteChange: number
// }
