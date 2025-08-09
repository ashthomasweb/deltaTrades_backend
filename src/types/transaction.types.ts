import { ExtTick, Tick } from '@/types'

// This is a temporary shape...
export type QueueType = {
  elements: ExtTick[] | Tick[] | null
  head: number
  tail: number
}
