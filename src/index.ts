import { initApp } from './__core/init'
import { Logger } from './__core/logger'

initApp().catch((error) => {
  Logger.error('Error initializing app:', error)
  process.exit(1)
})
