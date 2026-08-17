import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export const config = {
  matcher: [
    '/admin/:path*',
    '/cashier/:path*',
    '/kitchen/:path*',
    '/api/admin/:path*',
    '/api/audit-logs/:path*',
    '/api/inventory/transfers/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract token from Cookie or Bearer Header
  const token =
    req.cookies.get(AUTH_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  const payload = token ? await verifyJwtEdge(token) : null;

  // ── 1. Protection for /admin and /api/admin/* ──────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!payload || payload.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Akses ditolak. Akses Administrator diperlukan.',
            code: payload ? 'FORBIDDEN' : 'UNAUTHORIZED',
          },
          { status: payload ? 403 : 401 }
        );
      }
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('authRequired', 'admin');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── 2. Protection for Audit Logs API /api/audit-logs/* ─────────────
  if (pathname.startsWith('/api/audit-logs')) {
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Akses ditolak. Akses Audit Trail hanya untuk Administrator.',
          code: payload ? 'FORBIDDEN' : 'UNAUTHORIZED',
        },
        { status: payload ? 403 : 401 }
      );
    }
  }

  // ── 3. Protection for Inter-Branch Transfers API ──────────────────
  if (pathname.startsWith('/api/inventory/transfers')) {
    if (!payload || (payload.role !== 'admin' && payload.role !== 'cashier')) {
      return NextResponse.json(
        {
          error: 'Akses ditolak. Diperlukan role Admin atau Kasir.',
          code: payload ? 'FORBIDDEN' : 'UNAUTHORIZED',
        },
        { status: payload ? 403 : 401 }
      );
    }
  }

  // ── 4. Protection for /cashier ────────────────────────────────────
  if (pathname.startsWith('/cashier')) {
    if (!payload || (payload.role !== 'cashier' && payload.role !== 'admin')) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('authRequired', 'cashier');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── 5. Protection for /kitchen ────────────────────────────────────
  if (pathname.startsWith('/kitchen')) {
    if (
      !payload ||
      (payload.role !== 'kitchen' &&
        payload.role !== 'cashier' &&
        payload.role !== 'admin')
    ) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('authRequired', 'kitchen');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Inject session details into downstream request headers
  const requestHeaders = new Headers(req.headers);
  if (payload) {
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.name);
    if (payload.branchId) {
      requestHeaders.set('x-user-branch', payload.branchId);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
