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

// TODO: new 'type' 'closeRequest' isn't exactly a SourceType. Need to think how this comes across from FE to BE
export type SourceType = 'historical' | 'real-time' | 'closeRequest' | 'storedData' | 'analysis' | undefined
export type DataSource = 'alpha-vantage' | 'tradier' | 'storedData' | undefined
export type OutputFormat = 'chart' | 'queue' | 'normalized' | undefined

/**
 * General options for conversion functions.
 */
export type ConversionOptions = {
  isTest?: boolean
  inputType?: any // TODO: Check and refine this param
  inputSource?: any // TODO: Check and refine this param
  originator?: any // TODO: Check and refine this param
  tickerSymbol?: string
  interval?: string
  start?: string
  end?: string
  count?: number
}