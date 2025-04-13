/* src/__core/event-bus.ts */

import { EventEmitter } from 'events'

export class EventBus extends EventEmitter {
  constructor() {
    super()
  }
}

/**
 * NOTE: Currently (4-12-25), this is being instantiated with 'new' in the app initialization.
 * I'm wondering if we could create it as a Singleton here, and export -> import the instance
 * in various modules around the app. Currently, the webSocket server requires it as a parameter.
 * The more we encapsulate logic, the trickier it will be if we need to pass the instance around.
 **/
