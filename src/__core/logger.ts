/**
 * @file src/__core/logger.ts
 * @fileoverview Centralized Logger utility for the DeltaTrades backend.
 * 
 * Provides standardized logging methods for:
 * - Console output (info, error, debug levels)
 * - File-based logging with timestamped messages
 * - Section dividers for organizing log files
 * 
 * import { Logger } from './__core/logger'
 * Logger.info('Starting process...')
 * Logger.toFileOut('daily/run.log', 'Process started', { meta: 'data' })
 * 
 * Note:
 * Log files are written relative to `src/logs/` and will auto-create directories as needed.
**/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the current file's directory (for compatibility with ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base directory for writing log files
const baseLogDir = path.resolve(__dirname, '../logs')

type ToFileOutOptions = {
  overwrite?: boolean
}

export const Logger = {
  /**
   * @function info
   * @description Log informational messages to the console
   * 
   * @param msgs One or more messages to log as informational output.
   */
  info: (...msgs: any[]) => console.log('[INFO]', ...msgs),

  /**
   * @function error
   * @description Log error messages to the console/terminal
   * 
   * @param msgs One or more messages to log as error output.
   */
  error: (...msgs: any[]) => console.error('[ERROR]', ...msgs),

  /**
   * @function debug
   * @description Log debug messages to the console
   * TODO - Potentially retire when DebugService is more robust
   * 
   * @param msgs One or more messages to log as debug output.
   */
  debug: (...msgs: any[]) => console.debug('[DEBUG]', ...msgs),

  /**
   * @function toFileOut
   * @description Write a formatted log message (with optional data) to a file.
   *
   * @param relativeFilePath - File path relative to the logs directory (e.g. "test/run.log")
   * @param message - The primary log message string
   * @param data - Optional data to log (object, string, number, etc.)
   * @param options - Optional settings
   *   - overwrite: If true, replaces the file content instead of appending
   */
  toFileOut: (
    relativeFilePath: string,
    message: string,
    data?: unknown,
    options: ToFileOutOptions = {},
  ): void => {
    const timestamp = new Date().toISOString()
    const formatted = `[${timestamp}] ${message}`

    // Format data if provided — stringify objects/arrays nicely
    let prettyData: string | undefined

    if (typeof data === 'string' || typeof data === 'number') {
      prettyData = String(data)
    } else if (typeof data === 'object' && data !== null) {
      prettyData = JSON.stringify(data, null, 2)
    }

    // Final log content block
    const fullLog = data ? `${formatted}\n${prettyData}\n\n` : `${formatted}\n`

    // Resolve full absolute path and ensure directory exists
    const absolutePath = path.resolve(baseLogDir, relativeFilePath)
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write or append to the log file based on the 'overwrite' option
    if (options.overwrite) {
      fs.writeFileSync(absolutePath, fullLog) // clear + write
    } else {
      fs.appendFileSync(absolutePath, fullLog) // append
    }
  },

  /**
   * @function divider
   * @description Inserts a visual divider in the log file, optionally labeled
   *
   * @param relativeFilePath - Target file path within logs
   * @param label - Optional section label to include in the divider
   */
  divider: (relativeFilePath: string, label: string = '') => {
    const line = '='.repeat(40)
    const section = label
      ? `= ${label} ` + '='.repeat(40 - label.length - 3)
      : line
    Logger.toFileOut(relativeFilePath, section)
  },
}
