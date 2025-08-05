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
import { AlphaVantageResponse, ConversionOptions, DataSource, NormalizedData, OutputFormat, RequestParams, SourceType, TradierResponse } from '@/types'

import {
  convertAVtoNormalized,
  convertTradierToNormalized,
  convertNormalizedToChart,
  convertNormalizedToTransactionPacket,
} from './adapter-utils'

import DebugService from '../debug'

class DataAdapter {
  inputType!: SourceType | undefined
  inputSource!: DataSource | undefined
  outputType!: OutputFormat | undefined
  normalizedData: Partial<NormalizedData> | undefined
  requestParams: Partial<RequestParams>
  options: any

  constructor(requestParams: 
    Partial<RequestParams>, 
    data: AlphaVantageResponse | TradierResponse | NormalizedData, 
    options: Partial<ConversionOptions> | null = null
  ) {
    this.inputType = requestParams.type
    this.inputSource = requestParams.dataSource
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
    if (this.inputSource === 'alpha-vantage') {
      this.alphaVantageToNormalized(data as AlphaVantageResponse, options)
    }
    if (this.inputSource === 'tradier') {
      this.tradierToNormalized(data as TradierResponse, options)
    }
    if (this.inputSource === 'storedData') {
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
      inputSource: this.inputSource,
      inputType: this.inputType,
      originator: this.requestParams.originator,
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
      inputSource: this.inputSource,
      inputType: this.inputType,
      originator: this.requestParams.originator,
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
  normalizedToQueueFormat() {
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
    } else if (outputType === 'queue') {
      return this.normalizedToQueueFormat()
    } else if (outputType === 'normalized') {
      return this.normalizedData
    }
  }
}

export default DataAdapter
