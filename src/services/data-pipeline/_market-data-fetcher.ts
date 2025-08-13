/**
 * @file src/services/data/market-data-fetcher.ts
 * @fileoverview Provides methods for fetching market data from external APIs or local files.
 * 
 * Responsibilities:
 * - Fetch historical market data from a remote API.
 * - Fetch realTime market data using an authenticated API request.
 * - Read locally saved historical market data files for testing or offline analysis.
**/

import { config } from '../../__core/config'
import { Logger } from '@/__core/logger'
import { promises as fs } from 'fs'
import axios from 'axios'
import DebugService from '../debug'
import { AlphaVantageResponse, NormalizedData, TradierResponse } from '@/types/tick-data.types'

export const marketDataFetcher = {
  /**
   * @function fetchHistorical 
   * @description Fetches historical market data from the configured remote API.
   * 
   * @param params - Query string parameters for the historical data API request.
   * @returns {Promise} Parsed response data from the historical API.
   */
  async fetchHistorical(params: string): Promise<AlphaVantageResponse> {
    const response = await axios.get(`${config.HISTORICAL_API_BASE_URL}${params}`)
    return response.data
  },

  /**
   * @function fetchRealtime 
   * @description Fetches realTime market data from the configured authenticated API.
   * 
   * @param paramString - Query string parameters for the realTime API request.
   * @returns {Promise} Parsed response data from the realTime API.
   */
  async fetchRealtime(paramString: string): Promise<TradierResponse> {
    const response = await axios.get(`${config.REALTIME_REQUEST_BASE_URL}${paramString}`, {
      headers: {
        Authorization: `Bearer ${config.REALTIME_API_KEY}`,
        Accept: 'application/json',
      },
    })
    DebugService.trace()
    console.log('response.data', response.data)
    return response.data
  },

  /**
   * @function fetchHistoricalSavedData
   * @description Reads and parses locally saved historical market data from a JSON file.
   * 
   * @param filepath - Path to the local JSON file containing saved historical data.
   * @returns {Promise} Parsed JSON data from the file.
   * @throws {Error} If reading or parsing the file fails.
   */
  async fetchHistoricalSavedData(filepath: string): Promise<NormalizedData> {
    try {
      const jsonString = await fs.readFile(filepath, 'utf8')
      const data = JSON.parse(jsonString)
      return data
    } catch (err) {
      Logger.error(`Failed to read or parse mock file: ${filepath}`, err)
      throw err
    }
  },
}
