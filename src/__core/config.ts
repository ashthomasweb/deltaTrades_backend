import dotenv from 'dotenv'
dotenv.config()

export const config = {
  REALTIME_REQUEST_BASE_URL: 'https://api.tradier.com/v1/markets/timesales?',
  REALTIME_STREAM_BASE_URL: 'https://api.tradier.com/v1/markets/events/session',
  REALTIME_WS_BASE_URL: 'wss://ws.tradier.com/v1/markets/events',
  HISTORICAL_API_BASE_URL: 'https://www.alphavantage.co/query?',
  REALTIME_API_KEY: process.env.TRADIER_KEY || '',
  HISTORICAL_API_KEY: process.env.ALPHA_VANTAGE_KEY || '',
}
