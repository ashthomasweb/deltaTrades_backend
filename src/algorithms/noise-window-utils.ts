/* Chop/Noise Utils */

import { ExtTick } from './algo-utils'

type NoiseOptions = {
  atrMultiplier: number
  alternationThreshold: number
  huggingRatio: number // e.g., 0.8
}

export function getAllNoiseWindows(data: ExtTick[], noiseFunction: (array: ExtTick[]) => boolean) {
  let noiseWindows: ExtTick[][] = []
  let windowArray = []

  for (let i = 10; i < data.length; i++) {
    windowArray = data.slice(i - 7, i - 1)
    if (noiseFunction(windowArray)) {
      noiseWindows.push(windowArray)
    }
  }

  const group: any = {}
  for (const array of noiseWindows) {
    if (group[array[0].timestamp!] === undefined) {
      group[array[0].timestamp!] = {
        start: array[0].timestamp,
        end: array[array.length - 1].timestamp,
        data: [...array],
      }
    }
  }

  return group
}

export function isNoisyWindow1(
  data: ExtTick[],
  options: NoiseOptions = {
    atrMultiplier: 0.5,
    alternationThreshold: 0.6,
    huggingRatio: 0.7, // Accepts range of [1 - 0]. Lower values result in more noise windows picked up
  },
): boolean {
  function isHuggingMA(data: ExtTick[], multiplier = 0.5, threshold: number): boolean {
    const avgTrueRange = (data: ExtTick[]): number => {
      const ranges = data.map((t) => t.high - t.low)
      return ranges.reduce((sum, r) => sum + r, 0) / ranges.length
    }

    const huggingTicksAvg =
      data.filter((tick) => {
        return Math.abs(tick.close - tick.movingAvg) < avgTrueRange(data) * multiplier
      }).length / data.length

    return huggingTicksAvg >= threshold
  }

  const analyzeWindowIndecision = (data: ExtTick[], threshold: number) => {
    const avgIndecision =
      data.reduce((acc, tick) => {
        const body = Math.abs(tick.close - tick.open)
        const range = tick.high - tick.low || 1
        return acc + body / range
      }, 0) / data.length

    const indecisive = avgIndecision < threshold
    return indecisive
  }

  function isAlternating(data: ExtTick[], threshold: number): boolean {
    const directions = data.map((tick) => {
      if (tick.close > tick.open) return 1
      if (tick.close < tick.open) return -1
      return 0 // tie
    })

    let alternations = 0
    let prev = directions[0]

    for (let i = 1; i < directions.length; i++) {
      const curr = directions[i]
      if (curr === 0) continue // skip ties
      if (prev !== 0 && curr !== prev) alternations++
      prev = curr
    }

    const alternationRatio = alternations / data.length
    return alternationRatio > threshold
  }

  const hugging = isHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && indecisive && alternating
}

export function isNoisyWindow2(
  data: ExtTick[],
  options: NoiseOptions = {
    atrMultiplier: 0.5,
    alternationThreshold: 0.6,
    huggingRatio: 0.7, // Accepts range of [1 - 0]. Lower values result in more noise windows picked up
  },
): boolean {
  function isHuggingMA(data: ExtTick[], multiplier = 0.5, threshold: number): boolean {
    const avgTrueRange = (data: ExtTick[]): number => {
      const ranges = data.map((t) => t.high - t.low)
      return ranges.reduce((sum, r) => sum + r, 0) / ranges.length
    }

    const huggingTicksAvg =
      data.filter((tick) => {
        return Math.abs(tick.close - tick.movingAvg) < avgTrueRange(data) * multiplier
      }).length / data.length

    return huggingTicksAvg >= threshold
  }

  const analyzeWindowIndecision = (data: ExtTick[], threshold: number) => {
    const avgIndecision =
      data.reduce((acc, tick) => {
        const body = Math.abs(tick.close - tick.open)
        const range = tick.high - tick.low || 1
        return acc + body / range
      }, 0) / data.length

    const indecisive = avgIndecision < threshold
    return indecisive
  }

  function isAlternating(data: ExtTick[], threshold: number): boolean {
    const directions = data.map((tick) => {
      if (tick.close > tick.open) return 1
      if (tick.close < tick.open) return -1
      return 0 // tie
    })

    let alternations = 0
    let prev = directions[0]

    for (let i = 1; i < directions.length; i++) {
      const curr = directions[i]
      if (curr === 0) continue // skip ties
      if (prev !== 0 && curr !== prev) alternations++
      prev = curr
    }

    const alternationRatio = alternations / data.length
    return alternationRatio > threshold
  }

  const hugging = isHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  return hugging && (indecisive || alternating)
}

export function isNoisyWindow3(
  data: ExtTick[],
  options: NoiseOptions = {
    atrMultiplier: 0.5,
    alternationThreshold: 0.6,
    huggingRatio: 0.7, // Accepts range of [1 - 0]. Lower values result in more noise windows picked up
  },
): boolean {
  function isHuggingMA(data: ExtTick[], multiplier = 0.5, threshold: number): boolean {
    const avgTrueRange = (data: ExtTick[]): number => {
      const ranges = data.map((t) => t.high - t.low)
      return ranges.reduce((sum, r) => sum + r, 0) / ranges.length
    }

    const huggingTicksAvg =
      data.filter((tick) => {
        return Math.abs(tick.close - tick.movingAvg) < avgTrueRange(data) * multiplier
      }).length / data.length

    return huggingTicksAvg >= threshold
  }

  const analyzeWindowIndecision = (data: ExtTick[], threshold: number) => {
    const avgIndecision =
      data.reduce((acc, tick) => {
        const body = Math.abs(tick.close - tick.open)
        const range = tick.high - tick.low || 1
        return acc + body / range
      }, 0) / data.length

    const indecisive = avgIndecision < threshold
    return indecisive
  }

  function isAlternating(data: ExtTick[], threshold: number): boolean {
    const directions = data.map((tick) => {
      if (tick.close > tick.open) return 1
      if (tick.close < tick.open) return -1
      return 0 // tie
    })

    let alternations = 0
    let prev = directions[0]

    for (let i = 1; i < directions.length; i++) {
      const curr = directions[i]
      if (curr === 0) continue // skip ties
      if (prev !== 0 && curr !== prev) alternations++
      prev = curr
    }

    const alternationRatio = alternations / data.length
    return alternationRatio > threshold
  }

  const hugging = isHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}

export function isNoisyWindow4(
  data: ExtTick[],
  options: NoiseOptions = {
    atrMultiplier: 0.5,
    alternationThreshold: 0.6,
    huggingRatio: 0.7, // Accepts range of [1 - 0]. Lower values result in more noise windows picked up
  },
): boolean {
  function isHuggingMA(data: ExtTick[], multiplier = 0.5, threshold: number): boolean {
    const avgTrueRange = (data: ExtTick[]): number => {
      const ranges = data.map((t) => t.high - t.low)
      return ranges.reduce((sum, r) => sum + r, 0) / ranges.length
    }

    const huggingTicksAvg =
      data.filter((tick) => {
        return Math.abs(tick.close - tick.movingAvg) < avgTrueRange(data) * multiplier
      }).length / data.length

    return huggingTicksAvg >= threshold
  }

  const analyzeWindowIndecision = (data: ExtTick[], threshold: number) => {
    const avgIndecision =
      data.reduce((acc, tick) => {
        const body = Math.abs(tick.close - tick.open)
        const range = tick.high - tick.low || 1
        return acc + body / range
      }, 0) / data.length

    const indecisive = avgIndecision < threshold
    return indecisive
  }

  function isAlternating(data: ExtTick[], threshold: number): boolean {
    const directions = data.map((tick) => {
      if (tick.close > tick.open) return 1
      if (tick.close < tick.open) return -1
      return 0 // tie
    })

    let alternations = 0
    let prev = directions[0]

    for (let i = 1; i < directions.length; i++) {
      const curr = directions[i]
      if (curr === 0) continue // skip ties
      if (prev !== 0 && curr !== prev) alternations++
      prev = curr
    }

    const alternationRatio = alternations / data.length
    return alternationRatio > threshold
  }

  const hugging = isHuggingMA(data, options.atrMultiplier, options.huggingRatio)
  const indecisive = analyzeWindowIndecision(data, options.alternationThreshold)
  const alternating = isAlternating(data, options.alternationThreshold)

  let score = 0
  hugging && score++
  indecisive && score++
  alternating && score++
  return score >= 2
}
