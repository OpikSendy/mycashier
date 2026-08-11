import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';

export interface Voucher {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number; // e.g. 10 for 10% or 15000 for Rp 15.000
  minSpend?: number;
  description: string;
  isActive: boolean;
}

const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: 'vouch-1',
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minSpend: 30000,
    description: 'Diskon 10% khusus pengunjung baru (Min. belanja Rp 30.000)',
    isActive: true,
  },
  {
    id: 'vouch-2',
    code: 'HEMAT20',
    type: 'PERCENTAGE',
    value: 20,
    minSpend: 50000,
    description: 'Diskon 20% hemat banget (Min. belanja Rp 50.000)',
    isActive: true,
  },
  {
    id: 'vouch-3',
    code: 'MYCASHIER50',
    type: 'FLAT',
    value: 25000,
    minSpend: 100000,
    description: 'Potongan Rp 25.000 pesta makan bersama (Min. belanja Rp 100.000)',
    isActive: true,
  },
];

/** GET /api/vouchers — Returns active vouchers */
export async function GET() {
  return NextResponse.json({ source: 'fallback', data: DEFAULT_VOUCHERS });
}

/** POST /api/vouchers — Validates voucher code and calculates discount */
export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Kode kupon wajib diisi' }, { status: 400 });
    }

    const voucher = DEFAULT_VOUCHERS.find(
      (v) => v.code.toUpperCase() === code.trim().toUpperCase() && v.isActive
    );

    if (!voucher) {
      return NextResponse.json({ error: 'Kode kupon tidak valid atau sudah kadaluarsa' }, { status: 404 });
    }

    if (voucher.minSpend && subtotal < voucher.minSpend) {
      return NextResponse.json(
        {
          error: `Minimal transaksi untuk kupon ${voucher.code} adalah Rp ${voucher.minSpend.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * voucher.value) / 100);
    } else {
      discountAmount = Math.min(subtotal, voucher.value);
    }

    return NextResponse.json({
      success: true,
      voucher,
      discountAmount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memproses kupon promo' }, { status: 500 });
  }
}
