import { AlgoProcessType } from "@/types"
import { Logger } from "./logger"
import DebugService from "@/services/debug"

class DataCache {
  private static datasets: Map<string, any> = new Map()

  constructor() {

  }

  // TODO: Needs interval - and to distinguish from the same ticker but different stored data - Do I need the dataSource??
  createDatasetId(processType: AlgoProcessType, dataSource: string, tickerSymbol: string, date: string, interval: string, storedDataFilename?: string) { 
    return `${date}:${processType}:${interval}:${processType === 'batch' ? storedDataFilename : tickerSymbol}:${dataSource}`
  }

  storeDataset(datasetId: string, data: any) {
    DebugService.trace(null, 'red', 'italic')

    const processType = datasetId.split(':')[0]
    let existingDataset = DataCache.datasets.get(datasetId)
    if (existingDataset) {
      switch (processType) {
        case 'most-recent':
          existingDataset.push(data)
          break

        case 'batch':
          existingDataset = data
          break

        default:
          break
      }
    } else {
      DataCache.datasets.set(datasetId, data)
    }

    Logger.info(DataCache.datasets)
  }

  clearDataset() {

  }

  clearAllDatasets() {

  }

  createBaseExtension() {

  }

  provideDataset() {

  }
}

export default new DataCache()