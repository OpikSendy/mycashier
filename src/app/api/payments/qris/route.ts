import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Order ID dan nominal wajib diisi' }, { status: 400 });
    }

    const qrisPayload = `00020101021226670016ID.CO.QRIS.WWW01189360091430000000000215200458115303360540${amount}5802ID5915MYCASHIER RESTO6007JAKARTA6304`;

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      qrisPayload,
      expiresInSeconds: 30,
      message: 'QRIS Dynamic Berhasil Digenerate',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal membuat QRIS payment' }, { status: 500 });
  }
}
