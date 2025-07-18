/* Time Utils */

import { ExtTick } from '@/types'

export const isBefore945am = (tick: ExtTick) => {
  let result = false
  const invalidTimestamps = []
  for (let i = 30; i <= 44; i++) {
    invalidTimestamps.push(`09:${i.toString()}:00`)
  }

  for (const time of invalidTimestamps) {
    if (tick.timestamp?.includes(time)) {
      result = true
    }
  }
  return result
}
