import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await verifyApiAuth(req);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  return NextResponse.json({
    success: true,
    session: authResult.session,
  });
}
