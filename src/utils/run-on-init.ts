/**
 * @file src/__core/dev-cycle.ts
 * @fileoverview Development cycle utility module for DeltaTrades backend.
 * 
 * Attention:
 * - Do **NOT** include any critical application logic or business workflows in this module.
 * 
 * Purpose:
 * - This file contains helper functions intended solely for development and testing purposes.
 * - Supports quick experimentation, local data inspections, and utility tasks during development.
 * 
 * Example:
 * import { runOnInit } from './__core/dev-cycle'
 * await runOnInit()
 * 
 * Note:
 * You are responsible for commenting/uncommenting any specific dev tasks (e.g., file reads).
 * This module is excluded from production runtime and should remain isolated from core logic.
**/

import { Logger } from '../__core/logger'
import fs from 'fs'
import path from 'path'

export const runOnInit = async () => {
  Logger.info('DEV CYCLE runOnInit()')
  //---------------------------------------------------------------------//
  // ATTENTION!!
  // DO NOT PLACE ANY APPLICATION CRITICAL BUSINESS LOGIC IN THIS FILE.
  // FOR DEVELOPMENT CYCLE PURPOSES ONLY
  //---------------------------------------------------------------------//

  // Get all stored data filenames - copy paste from console to FE /src/config/stored-data-paths.ts
  function readDirectoryFileNames(directoryPath: string) {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err)
        return
      }

      const fileNames = files.filter((file) => {
        const filePath = path.join(directoryPath, file)
        return fs.statSync(filePath).isFile()
      })

      console.log('Files in directory:')
      fileNames.forEach((fileName) => console.log(fileName))
    })
  }

  const directoryPath = '../dt_backend/src/storedData' // Replace with the path to your directory
  // readDirectoryFileNames(directoryPath)

  //---------------------------------------------------------------------//
  Logger.info('END - DEV CYCLE runOnInit()')
}
