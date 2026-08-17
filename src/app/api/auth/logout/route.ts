import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, extractAuthToken } from '@/lib/auth';
import { verifyJwtEdge } from '@/lib/jwt';
import { createAuditLog, extractReqMetadata } from '@/lib/audit';

export async function POST(req?: NextRequest) {
  const { ipAddress, userAgent } = req
    ? extractReqMetadata(req)
    : { ipAddress: '127.0.0.1', userAgent: '' };
  const token = req ? extractAuthToken(req) : null;
  let session = null;
  if (token) {
    session = await verifyJwtEdge(token);
  }

  await createAuditLog({
    userId: session?.userId || 'usr-logout',
    userName: session?.name || 'User',
    userRole: session?.role || 'authenticated',
    actionType: 'USER_LOGOUT',
    entityType: 'auth',
    ipAddress,
    userAgent,
    description: `User ${session?.name || ''} (${session?.role || 'user'}) berhasil logout dari sistem`,
    status: 'SUCCESS',
  });

  const response = NextResponse.json({
    success: true,
    message: 'Berhasil keluar dari sesi',
  });

  // Clear HTTP-Only session cookie
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}


