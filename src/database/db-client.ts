/* src/database/db-client.ts */

import { Logger } from '../__core/logger'
import { config } from '../__core/config'
import mongoose from 'mongoose'
import EventBus from '../__core/event-bus'
import fs from 'fs'
import path, { dirname } from 'path'
import { NormalizedData } from '../types/types'
import { fileURLToPath } from 'url'
import EventEmitter from 'events'

export class DataBaseClient {
  private bus: EventEmitter

  constructor() {
    this.bus = EventBus
    this.init()
  }

  init() {
    this.bus.on('historical:data:db', (data: NormalizedData) => {
      Logger.info('DB received data', data.id, data.creationMeta, data.metaData, data.data.slice(0, 10))

      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)
      const DATA_DIR = path.resolve(__dirname, '../storedData')
      // eslint-disable-next-line max-len
      const FILE_PATH = `${DATA_DIR}/${data.metaData.tickerSymbol}-${data.metaData.interval}-${data.metaData.historicalMeta?.endDate.substring(0, 7)}-full.json`

      fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), (error) => {
        if (error) {
          console.error('Failed to save historical batch data:', error)
        } else {
          console.log('Historical batch data saved to', FILE_PATH)
        }
      })
    })
    this.bus.on('realTime:data:db', (data: any) => {
      Logger.info('DB received data', data)
    })
  }

  async initDB() {
    try {
      await mongoose.connect(config.MONGO_URL)
      Logger.info('MongoDB connected successfully')
    } catch (error) {
      Logger.error('Error connecting to MongoDB:', error)
      throw new Error('Failed to connect to MongoDB')
    }
  }
}
