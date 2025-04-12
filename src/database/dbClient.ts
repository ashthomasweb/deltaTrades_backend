import mongoose from 'mongoose'
import { Logger } from '../__core/logger'
import { config } from '../__core/config'

export async function initDB() {
  try {
    await mongoose.connect(config.MONGO_URL)
    Logger.info('MongoDB connected successfully')
  } catch (error) {
    Logger.error('Error connecting to MongoDB:', error)
    throw new Error('Failed to connect to MongoDB')
  }
}
