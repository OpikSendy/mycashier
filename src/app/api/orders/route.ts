import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { INITIAL_ORDERS } from '@/data/initialData';

/**
 * GET /api/orders
 * Returns all orders with their items.
 * Falls back to INITIAL_ORDERS if DB not configured.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ source: 'fallback', data: INITIAL_ORDERS });
  }

  try {
    const sql = getDb();

    // Fetch all orders
    const orders = (await sql`
      SELECT
        id, table_number AS "tableNumber", customer_name AS "customerName",
        total_amount AS "totalAmount", status,
        payment_status AS "paymentStatus", payment_method AS "paymentMethod",
        created_at AS "createdAt"
      FROM orders
      ORDER BY created_at DESC
    `) as any[];

    // Fetch all order_items for those orders (batch, not N+1)
    const orderIds = orders.map((o: any) => o.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const items = (await sql`
        SELECT
          id, order_id AS "orderId", product_id AS "productId",
          product_name AS "productName", price, quantity, notes
        FROM order_items
        WHERE order_id = ANY(${orderIds})
      `) as any[];

      items.forEach((item: any) => {
        if (!itemsMap[item.orderId]) itemsMap[item.orderId] = [];
        itemsMap[item.orderId].push(item);
      });
    }

    // Combine orders with their items
    const result = orders.map((order: any) => ({
      ...order,
      items: itemsMap[order.id] ?? [],
    }));

    return NextResponse.json({ source: 'database', data: result });
  } catch (error: any) {
    console.error('[GET /api/orders] DB error, falling back:', error.message);
    return NextResponse.json({ source: 'fallback', data: INITIAL_ORDERS });
  }
}

/**
 * POST /api/orders
 * Creates a new order + its items atomically.
 * Body: { order: Order, items: OrderItem[] }
 */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { order, items } = await req.json();
    const sql = getDb();

    // Insert order
    await sql`
      INSERT INTO orders (
        id, table_number, customer_name, total_amount,
        status, payment_status, payment_method, created_at
      ) VALUES (
        ${order.id}, ${order.tableNumber}, ${order.customerName},
        ${order.totalAmount}, ${order.status}, ${order.paymentStatus},
        ${order.paymentMethod}, ${order.createdAt}
      )
    `;

    // Insert order items (batch)
    for (const item of items) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, notes)
        VALUES (
          ${item.id}, ${order.id}, ${item.productId}, ${item.productName},
          ${item.price}, ${item.quantity}, ${item.notes ?? ''}
        )
      `;
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/orders]', error.message);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
