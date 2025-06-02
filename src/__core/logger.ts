/* src/__core/logger.ts */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseLogDir = path.resolve(__dirname, '../logs')

export const Logger = {
  info: (...msgs: any[]) => console.log('[INFO]', ...msgs),
  error: (...msgs: any[]) => console.error('[ERROR]', ...msgs),
  debug: (...msgs: any[]) => console.debug('[DEBUG]', ...msgs),
  toFileOut: (relativeFilePath: string, message: string, data?: any, options: { overwrite?: boolean } = {}) => {
    const timestamp = new Date().toISOString()
    const formatted = `[${timestamp}] ${message}`
    const prettyData = typeof data === 'string' || typeof data === 'number' ? data : JSON.stringify(data, null, 2)

    const fullLog = data ? `${formatted}\n${prettyData}\n\n` : `${formatted}\n`
    const absolutePath = path.resolve(baseLogDir, relativeFilePath)
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (options.overwrite) {
      fs.writeFileSync(absolutePath, fullLog) // clear + write
    } else {
      fs.appendFileSync(absolutePath, fullLog) // append
    }
  },
  divider: (relativeFilePath: string, label = '') => {
    const line = '='.repeat(40)
    const section = label ? `= ${label} ` + '='.repeat(40 - label.length - 3) : line
    Logger.toFileOut(relativeFilePath, section)
  },
}
