import axios from 'axios'
import { config } from '../../__core/config'
import { promises as fs } from 'fs'

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
    try {
      const jsonString = await fs.readFile(filepath, 'utf8')
      const data = JSON.parse(jsonString)
      // console.log('File data:', data)
      return data[0].data
    } catch (err) {
      console.error('Failed to read or parse mock file:', err)
      throw err
    }
  },
}
