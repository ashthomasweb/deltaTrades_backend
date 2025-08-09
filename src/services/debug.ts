/* src/services/debug.ts */

export type DebugTraceOptions = {
  color?: string
  tag?: string
}

export type AnsiColors = 'green' | 'blue' | 'red' | 'yellow' | 'magenta' | 'cyan'
export type AnsiStyles = 'bright' | 'dim' | 'italic' | 'underline'

const ansiColors: Record<string, string> = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}
const ansiReset = '\x1b[0m'

export const findFunctionInErrorStack = (functionName: string, msg?: string | null | undefined) => {
  const stack = new Error().stack?.split('\n') || []
  const line = stack.find(
    (l) => !l.includes('node_modules') && !l.includes(functionName) && !l.includes('Error'),
  )

  if (!line) return

  let logTag = functionName === 'DebugService.trace' ? '📌 TRACE: ' : '\nWARNING: '
  let logOutput = ''


  // Try to extract the function name and file location
  const match = line.match(/at (.+?) \((.*):(\d+):(\d+)\)/) || line.match(/at (.*):(\d+):(\d+)/)

  if (match) {
    if (match.length === 5) {
      const [, fnName, file, lineNo, col] = match
      let filePath = file.split('\\')[file.split('\\').length - 1]
      logOutput = `${logTag}${msg ? msg : fnName} @ ${filePath}:${lineNo}:${col}`
    } else if (match.length === 4) {
      const [, file, lineNo, col] = match
      let filePath = file.split('\\')[file.split('\\').length - 1]
      logOutput = `${logTag}${msg ? msg : '(anonymous)'} @ ${filePath}:${lineNo}:${col}`
    }
  } else {
    logOutput = `${logTag}${msg ? msg : line.trim()}`
  }

  return logOutput
}

class DebugService {
  globalDebug: boolean = true
  globalTrace: boolean = false
  globalWarn: boolean = false

  constructor() { }

  init() {
    // window.log = console.log()
  }

  warn(msg: string) {
    const functionName = 'DebugService.warn'

    const logOutput = findFunctionInErrorStack(functionName, msg)

    if (this.globalDebug || this.globalWarn) {
      console.log(`⚠️${ansiColors.yellow}${ansiColors.underline}${ansiColors.bright}${logOutput}${ansiReset}\n⚠️`)
    }
  }

  trace(
    msg?: string | null,
    color?: 'green' | 'blue' | 'red' | 'yellow' | 'magenta' | 'cyan' | null,
    style?: 'bright' | 'italic' | 'underline'
  ): void

  trace(msg?: string | null, color?: AnsiColors, style?: AnsiStyles) { // NOTE: Literal Types defined in-line specifically for Intellisense comment
    const functionName = 'DebugService.trace'

    const logOutput = findFunctionInErrorStack(functionName, msg)

    if (this.globalDebug || this.globalTrace) {
      console.log(`${style ? ansiColors[style] : ''}${color ? ansiColors[color] : ansiColors.blue}${logOutput}${ansiReset}`)
    }
  }
}

export default new DebugService()

