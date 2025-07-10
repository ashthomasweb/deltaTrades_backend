import { MetaData, CreationMeta } from '@/types'

export interface FrontEndChartPacket {
  id: number
  metaData: MetaData
  creationMeta: CreationMeta
  chartData: ChartDataShape
}

export interface ChartDataShape {
  categoryData: TimeStamp[]
  values: CandleStickValues[]
  volumes: CandleStickVolume[]
}

export type ChartData = {
  categoryData: string[]
  values: number[][]
  volumes: number[][]
}

export type TimeStamp = string // TODO: Make more explicit once timestamp format is finalized
export type CandleStickValues = [CSValueOpen, CSValueClose, CSValueLow, CSValueHigh, CSValueVolume]
export type CSValueOpen = number
export type CSValueClose = number
export type CSValueLow = number
export type CSValueHigh = number
export type CSValueVolume = number
export type CandleStickVolume = [VolumeIndex, CSValueVolume, VolumeColorNumericBoolean]
export type VolumeIndex = number
export type VolumeColorNumericBoolean = 1 | -1
