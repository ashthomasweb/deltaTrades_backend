/**
 * @file src/data-adapter/adapter-utils.ts
 * @fileoverview Data adapter utilities for transforming raw API responses into normalized internal structures.
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
  AlphaVantageResponse,
  CandleStickValues,
  CandleStickVolume,
  ChartDataShape,
  ConversionOptions,
  FrontEndChartPacket,
  NormalizedData,
  Tick,
  TimeStamp,
} from '@/types'

import DebugService from '../debug'

import { getTimestampMeta } from '@/utils/date-time'

export const convertNormalizedToTransactionPacket = (
  data: Partial<NormalizedData>,
  options?: Partial<ConversionOptions>
) => {
  if (!data.metaData || !data.creationMeta || !data.data) return
  const newTransactionPacket = {
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
    requestType: data.metaData.requestType,
    dataSource: data.metaData.dataSource,
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
  DebugService.trace()

  const requiredData = data as NormalizedData

  const frontEndPacket = {
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
  data: AlphaVantageResponse,
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

  if (!options.requestType || !options.dataSource || !options.requestOriginator) {
    throw new Error('Missing required options for convertAVtoNormalized')
  }

  output.metaData = {
    tickerSymbol: requestMetaData['2. Symbol'],
    interval: requestMetaData['4. Interval'],
    requestType: options.requestType,
    dataSource: options.dataSource,
    requestOriginator: options.requestOriginator,
    historicalMeta: {
      datasetSize: requestMetaData['5. Output Size'] === 'Compact' ? 'compact' : 'full',
      endDate: requestMetaData['3. Last Refreshed'],
      beginDate: dateArray[0],
    },
  }

  output.data = []

  for (let i = 0; i < dateArray.length; i++) {
    const data: Tick = {
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

  if (
    !options.tickerSymbol ||
    !options.interval ||
    !options.requestType ||
    !options.dataSource ||
    !options.requestOriginator
    // !options.start || // TODO: These aren't being passed or generated ... I think they are hold-overs from legacy solutions. Retire? Fill in?
    // !options.end // TODO: These aren't being passed or generated ... I think they are hold-overs from legacy solutions. Retire? Fill in?
  ) { // 
    console.log(options)
    throw new Error('Missing required options for convertTradierToNormalized')
  }

  output.metaData = {
    tickerSymbol: options.tickerSymbol,
    interval: options.interval,
    requestType: options.requestType,
    dataSource: options.dataSource,
    requestOriginator: options.requestOriginator,
    realTimeMeta: {
      endDate: options.end, // TODO: These aren't being passed or generated ... I think they are hold-overs from legacy solutions. Retire? Fill in?
      beginDate: options.start, // TODO: These aren't being passed or generated ... I think they are hold-overs from legacy solutions. Retire? Fill in?
    },
  }

  output.data = []

  for (let i = 0; i < dataset.length; i++) {
    const data: Tick = {
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
