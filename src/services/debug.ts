/* src/services/debug.ts */

class DebugService {
  constructor() {
    console.log('***\n%cTRACE: init DebugService', 'color: green; font-weight: 900')
  }

  init() {
    // window.log = console.log()
  }

  // TODO:
  // Add formatting option as second param to function - include color and [TAG]
  // Add flag for controlling the trace globally
  // Add flag in files for controlling the trace at the file level ??
  trace(msg?: string) {
    const stack = new Error().stack?.split('\n') || []
    const line = stack.find(
      (l) => !l.includes('node_modules') && !l.includes('DebugService.trace') && !l.includes('Error'),
    )

    if (!line) return

    // Try to extract the function name and file location
    const match = line.match(/at (.+?) \((.*):(\d+):(\d+)\)/) || line.match(/at (.*):(\d+):(\d+)/)

    let logLine = ''
    if (match) {
      if (match.length === 5) {
        const [, fnName, file, lineNo, col] = match
        let filePath = file.split('\\')[file.split('\\').length - 1]
        logLine = `📌 TRACE: ${msg ? msg : fnName} @ ${filePath}:${lineNo}:${col}`
      } else if (match.length === 4) {
        const [, file, lineNo, col] = match
        let filePath = file.split('\\')[file.split('\\').length - 1]
        logLine = `📌 TRACE: ${msg ? msg : '(anonymous)'} @ ${filePath}:${lineNo}:${col}`
      }
    } else {
      logLine = `📌 TRACE: ${msg ? msg : line.trim()}`
    }

    const GREEN = '\x1b[32m'
    const RESET = '\x1b[0m'

    console.log(`${GREEN}${logLine}${RESET}`)
  }
}

export default new DebugService()

// Reset	\x1b[0m
// Bright	\x1b[1m
// Dim	\x1b[2m
// Italic	\x1b[3m
// Underline	\x1b[4m
// Red	\x1b[31m
// Green	\x1b[32m
// Yellow	\x1b[33m
// Blue	\x1b[34m
// Magenta	\x1b[35m
// Cyan	\x1b[36m
// White	\x1b[37m
