/* src/services/data/market-data-fetcher.ts */

import { config } from '../../__core/config'
import { promises as fs } from 'fs'
import axios from 'axios'

export const marketDataFetcher = {
  async fetchHistorical(params: string) {
    const response = await axios.get(`${config.HISTORICAL_API_BASE_URL}${params}`)
    return response.data
  },

  async fetchRealtime(paramString: string) {
    const response = await axios.get(`${config.REALTIME_REQUEST_BASE_URL}${paramString}`, {
      headers: {
        Authorization: `Bearer ${config.REALTIME_API_KEY}`,
        Accept: 'application/json',
      },
    })
    return response.data
  },

  async fetchHistoricalSavedData(filepath: string) {
    try {
      const jsonString = await fs.readFile(filepath, 'utf8')
      const data = JSON.parse(jsonString)
      return data
    } catch (err) {
      console.error('Failed to read or parse mock file:', err)
      throw err
    }
  },
}
