import dotenv from 'dotenv'
dotenv.config()

export const config = {
  /* Tradier Real-time Websocket */
  REALTIME_REQUEST_BASE_URL: 'https://api.tradier.com/v1/markets/timesales?',
  REALTIME_SESSION_URL: 'https://api.tradier.com/v1/markets/events/session',
  REALTIME_WS_BASE_URL: 'wss://ws.tradier.com/v1/markets/events',
  REALTIME_API_KEY: process.env.TRADIER_KEY || '',

  /* AlphaVantage Historical HTTP */
  HISTORICAL_API_BASE_URL: 'https://www.alphavantage.co/query?',
  HISTORICAL_API_KEY: process.env.ALPHA_VANTAGE_KEY2 || '',
}
