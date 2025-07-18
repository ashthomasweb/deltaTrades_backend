/* src/types/types.ts */

export interface TransactionPacket {
  contractType: string | undefined
  tickerSymbol: string
  expiryDate: string | undefined
  createdAt: Date
  queue: any // Unsure of the shape of this
  optionChain: OptionContract[] | undefined
  analysisPacket: Record<string, any> | undefined
  completed: boolean | undefined
  isBuy: boolean | undefined
  history: Record<string, any>[]
  priceAtPurchase: number | undefined
  priceAtSale: number | undefined
  priceChange: number | undefined
  inputType: 'real-time' | 'historical'
  inputSource: 'AlphaVantage' | 'Tradier'
  limited?: Record<string, boolean> | undefined
  orderInfo?: OrderInfo | undefined
  isTest: boolean
  originator: 'frontend' | 'backend' | 'emergency'
}

export interface OrderInfo {
  orderId: string
  status: 'pending' | 'filled' | 'rejected'
  type: 'market' | 'limit' | 'stop'
  placedAt: Date
  confirmedAt?: Date
  brokerMessage?: string
}

// TODO: This is a temporary shape...
export type QueueType = {
  elements: ExtTick[] | Tick[] | null
  head: number
  tail: number
}

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

interface OptionContract {
  strikePrice: number
  expiry: string
  type: 'call' | 'put'
  premium: number
}

export interface FrontEndChartPacket {
  id: number
  metaData: MetaData
  creationMeta: CreationMeta
  chartData: ChartDataShape
}

export interface ChartDataShape {
  categoryData: TimeStamp[]
  values: CandleStickValues[]
  volumes: CandleStickVolume[]
}

export type TimeStamp = string // TODO: Make more explicit once timestamp format is finalized

export type CandleStickValues = [CSValueOpen, CSValueClose, CSValueLow, CSValueHigh, CSValueVolume]
export type CSValueOpen = number
export type CSValueClose = number
export type CSValueLow = number
export type CSValueHigh = number
export type CSValueVolume = number

export type CandleStickVolume = [VolumeIndex, CSValueVolume, VolumeColorNumericBoolean]
export type VolumeIndex = number
export type VolumeColorNumericBoolean = 1 | -1

export interface RequestParams {
  type: SourceType
  dataSource: DataSource
  symbol: string | undefined
  month: string | undefined
  interval: string | undefined
  savedData: string | undefined
  storeData: string | undefined
  backfill: string | undefined
  dataSize: string | undefined
  algorithm: string | undefined
  sendToQueue: string | undefined
  enableTrading: string | undefined
  getPrevious: string | undefined
  beginDate: string | undefined
  originator: string | undefined
  returnToFE: boolean | undefined
  chartId: string | undefined
  algoParams: Record<string, any>
}

// TODO: new 'type' 'closeRequest' isn't exactly a SourceType. Need to think how this comes across from FE to BE
export type SourceType = 'historical' | 'real-time' | 'closeRequest' | 'storedData' | 'analysis' | undefined

export type DataSource = 'alpha-vantage' | 'tradier' | 'storedData' | undefined
export type OutputFormat = 'chart' | 'queue' | 'normalized' | undefined

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

export type ChartData = {
  categoryData: string[]
  values: number[][]
  volumes: number[][]
}
