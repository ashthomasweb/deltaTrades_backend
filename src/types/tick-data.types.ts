import { NumberValidateRequest } from "aws-sdk/clients/pinpoint"

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
  inputType: InputType
  inputSource: InputSource
  originator: Originator
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

export type InputType = 'historical' | 'real-time'
export type InputSource = 'AlphaVantage' | 'Tradier'
export type Originator = 'frontend' | 'backend' | 'emergency'

export interface Tick {
  timestamp: string | undefined
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export interface ExtTick extends Tick {
  percentChange?: number | null
  absoluteChange?: number | null
  vwap?: number | null
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

export type AlphaVantageResponse = {
  'Meta Data': {
    '1. Information': string
    '2. Symbol': string
    '3. Last Refreshed': string
    '4. Interval': string
    '5. Output Size': string
    '6. Time Zone': string
  } & {
    [key: string]: {
      [timestamp: string]: {
        '1. open': string
        '2. high': string
        '3. low': string
        '4. close': string
        '5. volume': string
      }
    }
  }
}

export type TradierResponse = {
  series: {
    data: TradierTickData | TradierTickData[]
  }
}

type TradierTickData = {
  time: string
  timestamp: number
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
}