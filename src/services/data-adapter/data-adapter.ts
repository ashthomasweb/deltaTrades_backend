/**
 * @file src/services/data-adapter/data-adapter.ts
 * @fileoverview DataAdapter class for normalizing various API response formats and 
 * converting them to application-specific data structures.
 * 
 * Responsibilities:
 * - Normalize raw data from AlphaVantage, Tradier, or pre-stored sources.
 * - Provide formatted outputs for charting or transaction queue consumption.
 * 
 * Key Methods:
 * - normalize(): Converts raw input data to normalized internal format.
 * - returnFormattedData(): Outputs data as 'chart', 'queue', or 'normalized' formats.
**/

import { Logger } from '../../__core/logger'
import { AlphaVantageResponse, ConversionOptions, DataSource, NormalizedData, OutputFormat, RequestParams, RequestType, TradierResponse } from '@/types'

import {
  convertAVtoNormalized,
  convertTradierToNormalized,
  convertNormalizedToChart,
  convertNormalizedToTransactionPacket,
} from './adapter-utils'

import DebugService from '../debug'

class DataAdapter {
  requestType!: RequestType | undefined
  dataSource!: DataSource | undefined
  outputType!: OutputFormat | undefined
  normalizedData: Partial<NormalizedData> | undefined
  requestParams: Partial<RequestParams>
  options: any

  constructor(requestParams: 
    Partial<RequestParams>, 
    data: AlphaVantageResponse | TradierResponse | NormalizedData, 
    options: Partial<ConversionOptions> | null = null
  ) {
    this.requestType = requestParams.requestType
    this.dataSource = requestParams.dataSource
    this.requestParams = requestParams
    this.normalizedData = undefined
    this.options = options
    this.init(data, options)
  }

  /**
   * Initialize the adapter on new class instance by converting raw data to normalized format,
   * depending on the specified data source.
   */
  private init(
    data: AlphaVantageResponse | TradierResponse | NormalizedData, 
    options: Partial<ConversionOptions> | null = null
  ) {
    DebugService.trace()
    if (this.dataSource === 'alpha-vantage') {
      this.alphaVantageToNormalized(data as AlphaVantageResponse, options)
    }
    if (this.dataSource === 'tradier') {
      this.tradierToNormalized(data as TradierResponse, options)
    }
    if (this.dataSource === 'storedData') {
      this.normalizedData = data as NormalizedData
    }
  }

  /**
   * Converts raw AlphaVantage data to normalized internal format
   */
  private alphaVantageToNormalized(
    data: AlphaVantageResponse, 
    options?: Partial<ConversionOptions> | null
  ) {
    this.normalizedData = convertAVtoNormalized(data, {
      dataSource: this.dataSource,
      requestType: this.requestType,
      requestOriginator: this.requestParams.requestOriginator,
    })
  }

  /**
   * Converts raw Tradier data to normalized internal format
   */
  private tradierToNormalized(
    data: TradierResponse, 
    options?: Partial<ConversionOptions> | null
  ) {
    this.normalizedData = convertTradierToNormalized(data, {
      dataSource: this.dataSource,
      requestType: this.requestType,
      requestOriginator: this.requestParams.requestOriginator,
      ...options,
    })
  }

  /**
   * Converts normalized data to a chart-friendly structure
   */
  normalizedToChartFormat() {
    if (!this.normalizedData) return null
    return convertNormalizedToChart(this.normalizedData, this.options)
  }

  /**
   * Converts normalized data into a queue packet format
   */
  normalizedToQueueFormat() { // TODO: There is no queue
    if (!this.normalizedData) return null
    return convertNormalizedToTransactionPacket(this.normalizedData)
  }

  /**
   * Returns the processed data in the requested output format.
   * Available formats: 'chart', 'queue', or 'normalized'.
   */
  returnFormattedData(outputType: OutputFormat) {
    if (outputType === 'chart') {
      return this.normalizedToChartFormat()
    } else if (outputType === 'queue') { // TODO: There is no queue - and this function creates a TransactionPacket - bad name - out of order - non-existent data structure
      return this.normalizedToQueueFormat()
    } else if (outputType === 'normalized') {
      return this.normalizedData
    }
  }
}

export default DataAdapter
