export interface TransactionPacket {
  contractType: string | undefined
  tickerSymbol: string
  expiryDate: string | undefined
  createdAt: Date
  queue: any // Unsure of the shape of this
  optionChain: OptionContract[] | undefined
  analysisPacket: Record<string, any> | undefined
  completed: boolean | undefined
  isBuy: boolean | undefined
  history: Record<string, any>[]
  priceAtPurchase: number | undefined
  priceAtSale: number | undefined
  priceChange: number | undefined
  inputType: 'real-time' | 'historical'
  inputSource: 'AlphaVantage' | 'Tradier'
  limited?: Record<string, boolean> | undefined
  orderInfo?: OrderInfo | undefined
  isTest: boolean
  originator: 'frontend' | 'backend' | 'emergency'
}

export interface OrderInfo {
  orderId: string
  status: 'pending' | 'filled' | 'rejected'
  type: 'market' | 'limit' | 'stop'
  placedAt: Date
  confirmedAt?: Date
  brokerMessage?: string
}

interface OptionContract {
  strikePrice: number
  expiry: string
  type: 'call' | 'put'
  premium: number
}
