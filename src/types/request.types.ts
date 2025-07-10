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
