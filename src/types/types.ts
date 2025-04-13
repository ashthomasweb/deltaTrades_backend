/* src/types/types.ts */

export interface DataPacket {
  contractType: string
  tickerSymbol: string
  expiryDate: string
  createdAt: Date
  queue: string[]
  optionChain: any[]
  analysisPacket: Record<string, any>
  completed: boolean
  isBuy: boolean
  history: Record<string, any>[]
  priceAtPurchase: number
  priceAtSale: number
  priceChange: number
  source?: 'realtime' | 'historical'
  limited?: Record<string, boolean>
  orderInfo?: OrderInfo
  isTest?: boolean
}

export interface OrderInfo {
  orderId: string
  status: 'pending' | 'filled' | 'rejected'
  type: 'market' | 'limit' | 'stop'
  placedAt: Date
  confirmedAt?: Date
  brokerMessage?: string
}
