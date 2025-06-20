/* src/__core/event-bus.ts */

import { EventEmitter } from 'events'

class EventBus extends EventEmitter {
  constructor() {
    super()
  }
}

export default new EventBus()
