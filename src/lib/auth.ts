import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge, AuthSession } from '@/lib/jwt';
import { UserRole } from '@/context/AppContext';

export { type AuthSession } from '@/lib/jwt';

export const AUTH_COOKIE_NAME = 'mycashier_session';

/** Default PINs for Enterprise RBAC roles */
export const DEFAULT_ROLE_PINS: Record<string, string> = {
  admin: '8888',
  cashier: '1234',
  kitchen: '5555',
};

/** Human-friendly role display names */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Admin CMS / Owner',
  cashier: 'Kasir POS',
  kitchen: 'Chef Dapur KDS',
  customer: 'Pelanggan / Meja',
};

/**
 * Check if a role satisfies the required roles.
 * Supports role inheritance (admin can access everything, cashier can access kitchen).
 */
export function hasRolePermission(userRole: UserRole, requiredRoles?: UserRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  // Admin has access to all roles
  if (userRole === 'admin') {
    return true;
  }
  // Cashier has access to kitchen views
  if (userRole === 'cashier' && requiredRoles.includes('kitchen')) {
    return true;
  }
  return false;
}

/**
 * Extract auth token from NextRequest via Cookie or Authorization Bearer header.
 */
export function extractAuthToken(req: NextRequest): string | null {
  // 1. Check HttpOnly cookie
  const cookieToken = req.cookies?.get?.(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken.trim();
  }

  // 2. Check Cookie header fallback
  const cookieHeader = req.headers?.get?.('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]).trim();
  }

  // 3. Check Authorization Header (Bearer <token>)
  const authHeader = req.headers?.get?.('authorization');
  if (authHeader && /^bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^bearer\s+/i, '').trim();
  }

  return null;
}


/**
 * Server-side API Route Authorization Guard.
 * Validates the JWT session from cookies/headers and verifies user role permissions.
 *
 * @param req NextRequest instance
 * @param allowedRoles Optional list of allowed UserRoles
 * @returns Object with either `{ session }` if authorized, or `{ errorResponse }` with standard 401/403 JSON.
 */
export async function verifyApiAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ session: AuthSession } | { errorResponse: NextResponse }> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Autentikasi dibutuhkan. Silakan login terlebih dahulu.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  const session = await verifyJwtEdge(token);
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Sesi tidak valid atau telah kadaluarsa. Silakan login kembali.',
          code: 'INVALID_SESSION',
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRolePermission(session.role as UserRole, allowedRoles)) {
    return {
      errorResponse: NextResponse.json(
        {
          error: `Akses ditolak. Diperlukan role [${allowedRoles.join(', ')}], role Anda: [${session.role}]`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}
