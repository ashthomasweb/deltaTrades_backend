import { RequestOriginator } from "./tick-data.types"

export interface RequestParams {
  requestType: RequestType
  dataSource: DataSource
  symbol: string | undefined
  month: string | undefined
  interval: string | undefined
  requestedStoredDataFilename: string | undefined
  storeRequestedData: string | undefined
  backfill: string | undefined
  dataSize: string | undefined
  algorithm: string | undefined
  sendToQueue: string | undefined
  enableTrading: string | undefined
  getPreviousDay: string | undefined
  beginDate: string | undefined
  requestOriginator: RequestOriginator
  returnToFE: boolean | undefined
  chartId: string | undefined
  algoParams: AlgoParams
}

export type AlgoParams = {
  noiseWindow: string
  noiseWindowLength: number
  atrMultiplier: number
  altThreshold: number
  hugRatio: number
  compBodyMult: number
  compFullThresh: number
  sma1Period: number
  sma2Period: number
  ema1Period: number
  ema2Period: number
  maAvgType: string
  singleDirMin: number
  oppThreshold: number
  rsiPeriod: number
  minCandleBodyDist: number
  slopePeriodByRawPrice: number
  slopePeriodBySMA: number
  slopePeriodByEMA: number
  adxPeriod: number
  macdShortPeriod: number
  macdLongPeriod: number
  macdSignalPeriod: number
  volumeTrendLookback: number
  volumeTrendMinTrend: number
  volumeTrendMinSurge: number
  bearEngTolerance: number
  bullExhThreshold: number
}

export type RequestType = 'historical' | 'realTime' | 'closeRequest' | 'storedData' | 'analysis' | undefined
export type DataSource = 'alpha-vantage' | 'tradier' | 'storedData' | undefined
export type OutputFormat = 'chart' | 'queue' | 'normalized' | undefined

/**
 * General options for conversion functions.
 */
export type ConversionOptions = {
  isTest?: boolean
  requestType?: RequestType
  dataSource?: DataSource
  requestOriginator?: RequestOriginator
  tickerSymbol?: string
  interval?: string
  start?: string
  end?: string
  count?: number
}