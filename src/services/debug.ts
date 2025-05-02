/* src/services/debug.ts */

class DebugService {
  constructor() {
    console.log(
      '***\n%cTRACE: init DebugService',
      'color: green; font-weight: 900',
    )
  }

  init() {
    // window.log = console.log()
  }
}

export default new DebugService()
