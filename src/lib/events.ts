import { EventEmitter } from 'events';

// Global Event Emitter for Real-Time SSE Broadcasting
class OrderEventEmitter extends EventEmitter {}

// Global singleton across hot reloads in Next.js dev server
const globalForEvents = globalThis as unknown as {
  orderEmitter?: OrderEventEmitter;
};

export const orderEmitter = globalForEvents.orderEmitter ?? new OrderEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.orderEmitter = orderEmitter;
}

export const ORDER_EVENT_TYPE = {
  CREATED: 'ORDER_CREATED',
  UPDATED: 'ORDER_UPDATED',
};
