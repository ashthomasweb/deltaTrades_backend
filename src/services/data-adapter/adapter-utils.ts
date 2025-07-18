/**
 * Data adapter utilities for transforming raw API responses into normalized internal structures.
 * 
 * This module contains functions to:
 * - Convert AlphaVantage and Trader API data into a standard NormalizedData shape.
 * - Adapt NormalizedData into transaction packets or front-end chart formats.
 * 
 * Primary conversions:
 * - convertAlphaVantageToNormalized: AlphaVantage -> NormalizedData
 * - convertTraderToNormalized: Trader -> NormalizedData
 * - convertNormalizedToTransactionPacket: NormalizedData -> TransactionPacket
 * - convertNormalizedToChart: NormalizedData -> FrontEndChartPacket
 * 
 * These utilities ensure consistent data structure for downstream processing, analytics, and visualization.
**/

import {
  CandleStickValues,
  CandleStickVolume,
  ChartDataShape,
  ConversionOptions,
  DataSource,
  FrontEndChartPacket,
  InputSource,
  InputType,
  NormalizedData,
  Originator,
  Tick,
  TimeStamp,
} from '@/types'
import { getTimestampMeta } from '@/utils/date-time'



export const convertNormalizedToTransactionPacket = (
  data: NormalizedData, 
  options?: Partial<ConversionOptions>
) => {
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

export const convertNormalizedToChart = (
  data: Partial<NormalizedData>, 
  options?: ConversionOptions
): FrontEndChartPacket | null => {
  if (!data || !data.data) return null

  const requiredData = data as NormalizedData

  let frontEndPacket = {
    id: requiredData.id,
    creationMeta: requiredData.creationMeta,
    metaData: requiredData.metaData,
    chartData: {
      categoryData: [] as TimeStamp[],
      values: [] as CandleStickValues[],
      volumes: [] as CandleStickVolume[],
    } as ChartDataShape,
  }

  for (let i = 0; i < requiredData.data.length; i++) {
    // TODO! How to handle the first tick? Is it green/red? We need previous tick data to calculate...
    const tick = requiredData.data[i]
    frontEndPacket.chartData.categoryData.push(tick.timestamp)
    frontEndPacket.chartData.values.push([
      tick.open,
      tick.close,
      tick.low,
      tick.high,
      tick.volume,
    ])
    frontEndPacket.chartData.volumes.push([
      options?.count || i,
      tick.volume,
      tick.open < tick.close ? 1 : -1,
    ])
  }

  return frontEndPacket
}

export const convertAVtoNormalized = (
  data: any, // TODO: Assert type of AlphaVantage
  options: ConversionOptions
): Partial<NormalizedData> | undefined => {
  // Logger.info('DataAdapter convertAVtoNormalized')

  const output: Partial<NormalizedData> = {
    id: Math.floor(Math.random() * 10e18),
    creationMeta: { ...getTimestampMeta() },
  }

  const requestMetaData = data['Meta Data']
  const requestDataByDate: any = Object.entries(data)[1][1]
  const dateArray = Object.keys(requestDataByDate).reverse()
  const dataArray: any[] = Object.values(requestDataByDate).reverse()

  if (!options.inputType || !options.inputSource || !options.originator) {
    throw new Error('Missing required options for convertAVtoNormalized')
  }

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

  for (let i = 0; i < dateArray.length; i++) {
    const data: Partial<Tick> | any = {
      timestamp: dateArray[i],
      open: +dataArray[i]['1. open'],
      close: +dataArray[i]['4. close'],
      high: +dataArray[i]['2. high'],
      low: +dataArray[i]['3. low'],
      volume: +dataArray[i]['5. volume'],
    }

    output.data.push(data)
  }

  return output
}

export const convertTradierToNormalized = (
  rawData: any, 
  options: ConversionOptions
): Partial<NormalizedData> => {
  // Logger.info('DataAdapter convertTradierToNormalized')

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

  if (!options.tickerSymbol || !options.interval || !options.inputType || !options.inputSource || !options.originator || !options.start || !options.end) {
    throw new Error('Missing required options for convertTraderToNormalized')
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

  for (let i = 0; i < dataset.length; i++) {
    const data: Partial<Tick> | any = {
      timestamp: dataset[i].time,
      open: dataset[i].open,
      close: dataset[i].close,
      high: dataset[i].high,
      low: dataset[i].low,
      volume: dataset[i].volume,
    }

    output.data.push(data)
  }

  return output
}
