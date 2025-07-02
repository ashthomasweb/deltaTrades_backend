import { Logger } from '../__core/logger'
import {
  CandleStickValues,
  CandleStickVolume,
  ChartDataShape,
  DataSource,
  FrontEndChartPacket,
  NormalizedData,
  Tick,
  OutputFormat,
  RequestParams,
  SourceType,
  TimeStamp,
} from '../types/types'

class DataAdapter {
  inputType!: SourceType | undefined
  inputSource!: DataSource | undefined
  outputType!: OutputFormat | undefined
  normalizedData: NormalizedData | any
  requestParams: Partial<RequestParams>
  options: any

  constructor(requestParams: Partial<RequestParams>, data: any, options: any = null) {
    this.inputType = requestParams.type
    this.inputSource = requestParams.dataSource
    this.requestParams = requestParams
    this.normalizedData = null
    this.options = options
    this.init(data, options)
  }

  // Initialize on new class instance
  private init(data: any, options = null) {
    if (this.inputSource === 'alpha-vantage') {
      this.alphaVantageToNormalized(data, options)
    }
    if (this.inputSource === 'tradier') {
      this.tradierToNormalized(data, options)
    }
    if (this.inputSource === 'storedData') {
      this.normalizedData = data
    }
  }

  // Raw AlphaVantage Data to Normalized
  private alphaVantageToNormalized(data: any, options?: any) {
    this.normalizedData = convertAVtoNormalized(data, {
      inputSource: this.inputSource,
      inputType: this.inputType,
      originator: this.requestParams.originator,
    })
  }

  // Raw Tradier Data to Normalized
  private tradierToNormalized(data: any, options?: any) {
    this.normalizedData = convertTradiertoNormalized(data, {
      inputSource: this.inputSource,
      inputType: this.inputType,
      originator: this.requestParams.originator,
      ...options,
    })
  }

  // Normalized to Chart
  normalizedToChartFormat() {
    return convertNormalizedToChart(this.normalizedData, this.options)
  }

  // Normalized to Queue
  normalizedToQueueFormat() {
    return convertNormalizedToTransactionPacket(this.normalizedData)
  }

  // Return - exposed method called from outside this class
  returnFormattedData(outputType: OutputFormat) {
    if (outputType === 'chart') {
      return this.normalizedToChartFormat()
    } else if (outputType === 'queue') {
      return this.normalizedToQueueFormat()
    } else if (outputType === 'normalized') {
      return this.normalizedData
    }
  }
}

export default DataAdapter

export const convertNormalizedToTransactionPacket = (data: any, options?: any) => {
  let newTransactionPacket = {
    contractType: undefined,
    tickerSymbol: data.metaData.tickerSymbol,
    expiryDate: undefined,
    createdAt: data.creationMeta.createdAtUTC,
    queue: [...data.data],
    optionChain: undefined,
    analysisPacket: undefined,
    completed: undefined,
    isBuy: undefined,
    history: [{ message: 'Packet initialized' }],
    priceAtPurchase: undefined,
    priceAtSale: undefined,
    priceChange: undefined,
    inputType: data.metaData.inputType,
    inputSource: data.metaData.inputSource,
    limited: undefined,
    orderInfo: undefined,
    isTest: options?.isTest || false,
  }
  return newTransactionPacket
}

const convertNormalizedToChart = (data: any, options?: any): FrontEndChartPacket => {
  let frontEndPacket = {
    id: data.id,
    creationMeta: data.creationMeta,
    metaData: data.metaData,
    chartData: {
      categoryData: [] as TimeStamp[],
      values: [] as CandleStickValues[],
      volumes: [] as CandleStickVolume[],
    } as ChartDataShape,
  }

  for (let i = 0; i <= data.data.length - 1; i++) {
    // TODO! How to handle the first tick? Is it green/red? We need previous tick data to calculate...
    frontEndPacket.chartData.categoryData.push(data.data[i].timestamp)
    frontEndPacket.chartData.values.push([
      data.data[i].open,
      data.data[i].close,
      data.data[i].low,
      data.data[i].high,
      data.data[i].volume,
    ])
    frontEndPacket.chartData.volumes.push([
      options?.count || i,
      data.data[i].volume,
      data.data[i].open < data.data[i].close ? 1 : -1,
    ])
  }

  return frontEndPacket
}

const convertAVtoNormalized = (data: any, options: any = null): Partial<NormalizedData> | undefined => {
  // Logger.info('DataAdapter convertAVtoNormalized')
  const output: Partial<NormalizedData> = {
    id: Math.floor(Math.random() * 10e18),
    creationMeta: { ...getTimestampMeta() },
  }

  const requestMetaData = data['Meta Data']
  const requestDataByDate: any = Object.entries(data)[1][1]
  const dateArray = Object.keys(requestDataByDate).reverse()
  const dataArray: any[] = Object.values(requestDataByDate).reverse()

  output.metaData = {
    tickerSymbol: requestMetaData['2. Symbol'],
    interval: requestMetaData['4. Interval'],
    inputType: options.inputType,
    inputSource: options.inputSource,
    originator: options.originator,
    historicalMeta: {
      datasetSize: requestMetaData['5. Output Size'] === 'Compact' ? 'compact' : 'full',
      endDate: requestMetaData['3. Last Refreshed'],
      beginDate: dateArray[0],
    },
  }

  output.data = []

  for (let i = 0; i <= dateArray.length - 1; i++) {
    const data: Partial<Tick> | any = {
      timestamp: dateArray[i],
      open: +dataArray[i]['1. open'],
      close: +dataArray[i]['4. close'],
      high: +dataArray[i]['2. high'],
      low: +dataArray[i]['3. low'],
      volume: +dataArray[i]['5. volume'],
    }
    if (i > 0) {
      data.percentChange = findPercentChange(dataArray[i]['1. close'], dataArray[i - 1]['1. close'])
      data.absoluteChange = findAbsoluteChange(dataArray[i]['1. close'], dataArray[i - 1]['1. close'])
    }
    output.data.push(data)
  }

  return output
}

const convertTradiertoNormalized = (rawData: any, options: any = null): Partial<NormalizedData> => {
  // Logger.info('DataAdapter convertTradiertoNormalized')
  let dataset
  if (rawData.series.data instanceof Array) {
    dataset = rawData.series.data
  } else if (Object.prototype.toString.call(rawData.series.data) === '[object Object]') {
    dataset = [rawData.series.data]
  }

  const output: Partial<NormalizedData> = {
    id: Math.floor(Math.random() * 10e18),
    creationMeta: { ...getTimestampMeta() },
  }

  output.metaData = {
    tickerSymbol: options.tickerSymbol,
    interval: options.interval,
    inputType: options.inputType,
    inputSource: options.inputSource,
    originator: options.originator,
    realTimeMeta: {
      endDate: options.end,
      beginDate: options.start,
    },
  }

  output.data = []

  for (let i = 0; i <= dataset.length - 1; i++) {
    const data: Partial<Tick> | any = {
      timestamp: dataset[i].time,
      open: dataset[i].open,
      close: dataset[i].close,
      high: dataset[i].high,
      low: dataset[i].low,
      volume: dataset[i].volume,
    }
    if (i > 0) {
      data.percentChange = findPercentChange(dataset[i].close, dataset[i - 1].close)
      data.absoluteChange = findAbsoluteChange(dataset[i].close, dataset[i - 1].close)
    }
    output.data.push(data)
  }

  return output
}

function findPercentChange(currentValue: string, previousValue: string) {
  const difference = findAbsoluteChange(currentValue, previousValue)
  const percentChange = (difference / parseFloat(previousValue)) * 100
  return +percentChange.toFixed(3)
}

function findAbsoluteChange(currentValue: string, previousValue: string) {
  return +(parseFloat(currentValue) - parseFloat(previousValue)).toFixed(3)
}

export function getTimestampMeta() {
  const now = new Date()
  return {
    createdAtUTC: now.toISOString(),
    createdAtLocal: now.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
