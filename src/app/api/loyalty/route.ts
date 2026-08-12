import { NextRequest, NextResponse } from 'next/server';

export interface MemberProfile {
  phone: string;
  name: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  nextTierPoints: number;
  progressPercent: number;
  perks: string[];
}

const DEFAULT_MEMBER: MemberProfile = {
  phone: '08123456789',
  name: 'Budi Santoso',
  points: 120,
  tier: 'SILVER',
  nextTierPoints: 150,
  progressPercent: 80,
  perks: ['Diskon 5% Member Silver', 'Gratis Upgrade Size Minuman', 'Prioritas Antrean'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (phone && phone !== '08123456789') {
    // Return fresh Bronze member for new phone
    return NextResponse.json({
      data: {
        phone,
        name: 'Member Baru',
        points: 10,
        tier: 'BRONZE',
        nextTierPoints: 50,
        progressPercent: 20,
        perks: ['Kumpulkan 1 Poin per Rp 10.000'],
      },
    });
  }

  return NextResponse.json({ data: DEFAULT_MEMBER });
}

export async function POST(req: NextRequest) {
  try {
    const { amount, phone } = await req.json();
    const earnedPoints = Math.floor((amount || 0) / 10000);

    return NextResponse.json({
      success: true,
      earnedPoints,
      message: `Selamat! Anda mendapatkan +${earnedPoints} Poin Loyalty dari transaksi ini!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memproses poin loyalty' }, { status: 500 });
  }
}
