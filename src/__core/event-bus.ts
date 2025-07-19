/**
 * @file src/__core/event-bus.ts
 * @fileoverview Application-wide Event Bus for inter-module communication.
 * 
 * This module creates and exports a singleton instance of Node.js `EventEmitter`
 * to serve as the event-driven backbone for the system.
 * 
 * Use this to emit and listen for custom application events across different modules
 * without direct coupling.
 * 
 * Example:
 * eventBus.emit('some-event', { data: 'value' })
 * eventBus.on('some-event', (payload) => { ... })
 */

import { EventEmitter } from 'events'

class EventBus extends EventEmitter {
  constructor() {
    super()
  }
}

export default new EventBus()
