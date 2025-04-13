/* src/services/data/market-data-adapter.ts */

import { config } from '../../__core/config'
import { promises as fs } from 'fs'
import axios from 'axios'

export const marketDataAdapter = {
  async fetchHistorical(params: any) {
    const response = await axios.get(
      `${config.HISTORICAL_API_BASE_URL}${params}`,
    )
    return response.data
  },

  async fetchRealtime(params: any) {
    const response = await axios.get(
      `${config.HISTORICAL_API_BASE_URL}${params}`,
    )
    return response.data
  },

  async fetchMock(filepath: string) {
    // TODO: Mock data will need to have a data contract assigned to it - so anything saved as a mock dataset will need to be run through the not-yet-built DataAdapter class
    try {
      const jsonString = await fs.readFile(filepath, 'utf8')
      const data = JSON.parse(jsonString)
      return data[0].data
    } catch (err) {
      console.error('Failed to read or parse mock file:', err)
      throw err
    }
  },
}
