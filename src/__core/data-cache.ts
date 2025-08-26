import { AlgoProcessType, NormalizedData, RequestParams } from "@/types"
import { Logger } from "./logger"
import DebugService from "@/services/debug"
import { baseTickExtension } from "@/algorithms/data-extension"

class DataCache {
  private static datasets: Map<string, any> = new Map()

  constructor() {

  }

  handleNewData(normalizedData: NormalizedData, requestParams: Partial<RequestParams>, algoProcessType: AlgoProcessType, datasetId: string) {
    const data = normalizedData.data

    // Perform basic data extension
    const baseExtendedData = baseTickExtension(data, algoProcessType)

    // Store data in registry
    this.storeDataset(datasetId, baseExtendedData)
  }

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

    Logger.info('DataCache current datasets\n', Array.from(DataCache.datasets))
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