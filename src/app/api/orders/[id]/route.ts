import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';

/**
 * PATCH /api/orders/[id]
 * Updates order status OR payment status.
 * Body: { status?: OrderStatus } | { paymentStatus: 'PAID', paymentMethod: PaymentMethod }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const sql = getDb();

    if (body.status) {
      // Update kitchen/order status
      await sql`
        UPDATE orders SET status = ${body.status}
        WHERE id = ${id}
      `;
    } else if (body.paymentStatus === 'PAID') {
      // Mark as paid with payment method
      await sql`
        UPDATE orders
        SET payment_status = 'PAID', payment_method = ${body.paymentMethod}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[PATCH /api/orders/${id}]`, error.message);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
