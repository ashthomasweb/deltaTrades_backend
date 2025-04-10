import axios from 'axios'
import { config } from '../../__core/config'

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
}
