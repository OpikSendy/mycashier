import { NextRequest } from 'next/server';
import { orderEmitter, ORDER_EVENT_TYPE } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ACK
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Event Handlers
      const onOrderCreated = (order: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: ORDER_EVENT_TYPE.CREATED, data: order })}\n\n`)
          );
        } catch (_) {}
      };

      const onOrderUpdated = (order: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: ORDER_EVENT_TYPE.UPDATED, data: order })}\n\n`)
          );
        } catch (_) {}
      };

      // Listen to events
      orderEmitter.on(ORDER_EVENT_TYPE.CREATED, onOrderCreated);
      orderEmitter.on(ORDER_EVENT_TYPE.UPDATED, onOrderUpdated);

      // Heartbeat every 15s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (_) {
          clearInterval(interval);
        }
      }, 15000);

      // Clean up on stream abort
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        orderEmitter.off(ORDER_EVENT_TYPE.CREATED, onOrderCreated);
        orderEmitter.off(ORDER_EVENT_TYPE.UPDATED, onOrderUpdated);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
