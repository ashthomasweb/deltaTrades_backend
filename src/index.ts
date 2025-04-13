/* src/index.ts */

import { initApp } from './__core/init'
import { Logger } from './__core/logger'

initApp().catch((error: unknown) => {
  Logger.error('Error initializing app:', error)
  process.exit(1)
})
