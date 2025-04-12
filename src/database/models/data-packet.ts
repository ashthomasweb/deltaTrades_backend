import { InferSchemaType, Schema, model } from 'mongoose'

const OrderInfoSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'filled', 'rejected'],
    },
    type: {
      type: String,
      required: true,
      enum: ['market', 'limit', 'stop'],
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
    },
    brokerMessage: {
      type: String,
    },
  },
  { _id: false },
)

const dataPacketSchema = new Schema({
  contractType: {
    type: String,
    required: true,
  },
  ticketSymbol: {
    type: String,
    required: true,
    index: true,
  },
  expiryDate: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  queue: {
    type: [String],
    required: true,
  },
  optionChain: {
    type: Array,
    required: true,
  },
  analysisPacket: {
    type: Object,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  isBuy: {
    type: Boolean,
    default: false,
  },
  history: {
    type: [Object],
    required: true,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
  },
  priceAtSale: {
    type: Number,
    required: true,
  },
  priceChange: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    enum: ['realtime', 'historical'],
  },
  limited: {
    type: Object,
  },
  orderInfo: {
    type: OrderInfoSchema,
  },
  isTest: {
    type: Boolean,
    default: false,
  },
})

export default model('DataPacket', dataPacketSchema)

export type DataPacket = InferSchemaType<typeof dataPacketSchema>
