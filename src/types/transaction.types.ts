import { ExtTick, Tick } from '@/types'

// TODO: This is a temporary shape...
export type QueueType = {
  elements: ExtTick[] | Tick[] | null
  head: number
  tail: number
}
