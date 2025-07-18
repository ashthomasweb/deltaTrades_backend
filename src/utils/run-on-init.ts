// import { marketDataFetcher } from '../services/data/_market-data-fetcher'
// import DataAdapter from '../services/data-adapter'
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

  // Example usage:
  const directoryPath = '../dt_backend/src/storedData' // Replace with the path to your directory
  // readDirectoryFileNames(directoryPath)

  //---------------------------------------------------------------------//
  Logger.info('END - DEV CYCLE runOnInit()')
}
