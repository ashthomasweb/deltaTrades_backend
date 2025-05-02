/* src/database/db-client.ts */

import { Logger } from '../__core/logger'
import { config } from '../__core/config'
import mongoose from 'mongoose'
import EventBus from '../__core/event-bus'

export class DataBaseClient {
  private bus: any

  constructor() {
    this.bus = EventBus
    this.init()
  }

  init() {
    this.bus.on('historical:data:db', (data: any) => {
      Logger.info('DB received data', data)
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
