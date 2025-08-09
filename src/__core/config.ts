/**
 * @file src/__core/config.ts
 * @fileoverview Central configuration module for environment variables and API endpoint constants.
 * 
 * This module handles:
 * - Loading environment variables via dotenv.
 * - Defining API endpoints for Tradier (real-time) and AlphaVantage (historical) data sources.
 * - Storing API keys and connection URLs in a single, importable object.
**/

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
  HISTORICAL_API_KEY: process.env.ALPHA_VANTAGE_KEY || '',

  /* MongoDB */
  MONGO_URL: process.env.MONGO_URL || '',
}

export const realTimeWebSocketSessionIdHeaders = {
  Authorization: `Bearer ${config.REALTIME_API_KEY}`,
  Accept: 'application/json',
}

/**
 * NOTE: Perhaps we should have a text file that we use to keep root level logs for the rate-limit per day
 * on AlphaVantage. We could have a data:count pair, which is used to log out the count as we are making
 * requests.
**/
