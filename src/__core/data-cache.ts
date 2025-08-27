import { AlgoProcessType, MetaData, NormalizedData } from "@/types"
import { Logger } from "./logger"
import DebugService from "@/services/debug"
import { baseTickExtension } from "@/algorithms/data-extension"

class DataCache {
  private static datasets: Map<string, any> = new Map()

  constructor() {}

  handleNewData(normalizedData: NormalizedData, algoProcessType: AlgoProcessType, datasetId: string) {
    const data = normalizedData.data

    // Perform basic data extension
    const baseExtendedData = baseTickExtension(data, algoProcessType)

    // Store data in registry
    this.storeDataset(datasetId, baseExtendedData)
  }

  createDatasetId(processType: AlgoProcessType, metaData: MetaData, storedDataFilename?: string) { 
    return `${new Date().toDateString()}:${processType}:${metaData.interval}:${processType === 'batch' ? storedDataFilename : metaData.tickerSymbol}:${metaData.dataSource}`
  }

  storeDataset(datasetId: string, data: any) {
    DebugService.trace(null, 'red', 'italic')

    const processType = datasetId.split(':')[1] // TODO: Refactor so that id parts can be looked up by key
    let existingDataset = DataCache.datasets.get(datasetId)
    if (existingDataset) {
      switch (processType) {
        case 'most-recent':
          existingDataset.push(data)
          break

        case 'batch':
          DataCache.datasets.set(datasetId, data)
          break

        default:
          break
      }
    } else {
      DataCache.datasets.set(datasetId, data)
    }

    Logger.info('DataCache current datasets\n', DataCache.datasets.keys())
  }

  clearDataset(datasetId: string) {
    DataCache.datasets.delete(datasetId)
  }

  clearAllDatasets() {
    DataCache.datasets.clear()
  }

  provideDataset(datasetId: string) {
    return DataCache.datasets.get(datasetId)
  }
}

export default new DataCache()