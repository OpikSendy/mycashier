import { describe, it, expect, beforeEach } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import { signJwt, verifyJwtEdge, decodeJwtUnsafe, type AuthSession } from '../../src/lib/jwt';
import {
  verifyApiAuth,
  hasRolePermission,
  extractAuthToken,
  DEFAULT_ROLE_PINS,
  AUTH_COOKIE_NAME,
} from '../../src/lib/auth';
import { POST as loginHandler } from '../../src/app/api/auth/login/route';
import { GET as meHandler } from '../../src/app/api/auth/me/route';
import { POST as logoutHandler } from '../../src/app/api/auth/logout/route';
import { middleware } from '../../src/middleware';

describe('Auth & RBAC Test Suite (tests/e2e/auth-rbac.test.ts)', () => {
  const adminSession: AuthSession = {
    userId: 'usr-admin-1',
    name: 'Admin Owner',
    role: 'admin',
    branchId: 'b-1',
  };

  const cashierSession: AuthSession = {
    userId: 'usr-cashier-1',
    name: 'Kasir Shift 1',
    role: 'cashier',
    branchId: 'b-1',
  };

  const kitchenSession: AuthSession = {
    userId: 'usr-kitchen-1',
    name: 'Chef Dapur Utama',
    role: 'kitchen',
    branchId: 'b-1',
  };

  const customerSession: AuthSession = {
    userId: 'usr-guest-1',
    name: 'Table 04 Guest',
    role: 'customer',
    branchId: 'b-1',
  };

  // Helper to construct mock NextRequest
  function createMockRequest(
    url: string,
    options: {
      method?: string;
      token?: string;
      useCookie?: boolean;
      useHeader?: boolean;
      body?: any;
    } = {}
  ): NextRequest {
    const headers = new Headers();
    if (options.useHeader && options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }
    if (options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const req = new NextRequest(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (options.useCookie && options.token) {
      req.cookies.set(AUTH_COOKIE_NAME, options.token);
    }

    return req;
  }

  // ==========================================
  // TIER 1: CORE FEATURE COVERAGE
  // ==========================================
  describe('Tier 1: Core Feature Coverage', () => {
    it('1.1 should verify default PIN definitions for all enterprise roles', () => {
      expect(DEFAULT_ROLE_PINS.admin).toBe('8888');
      expect(DEFAULT_ROLE_PINS.cashier).toBe('1234');
      expect(DEFAULT_ROLE_PINS.kitchen).toBe('5555');
    });

    it('1.2 should successfully sign and verify Admin JWT session with Web Crypto', async () => {
      const token = await signJwt(adminSession);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(adminSession.userId);
      expect(verified?.role).toBe('admin');
      expect(verified?.branchId).toBe('b-1');
    });

    it('1.3 should successfully sign and verify Cashier JWT session', async () => {
      const token = await signJwt(cashierSession);
      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(cashierSession.userId);
      expect(verified?.role).toBe('cashier');
      expect(verified?.name).toBe('Kasir Shift 1');
    });

    it('1.4 should successfully sign and verify Kitchen Staff JWT session', async () => {
      const token = await signJwt(kitchenSession);
      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(kitchenSession.userId);
      expect(verified?.role).toBe('kitchen');
    });

    it('1.5 should verify token extraction from HttpOnly session cookie', async () => {
      const token = await signJwt(cashierSession);
      const req = createMockRequest('http://localhost:3000/api/auth/me', {
        token,
        useCookie: true,
      });

      const extracted = extractAuthToken(req);
      expect(extracted).toBe(token);

      const authResult = await verifyApiAuth(req, ['cashier']);
      expect('session' in authResult).toBe(true);
      if ('session' in authResult) {
        expect(authResult.session.role).toBe('cashier');
      }
    });

    it('1.6 should verify token extraction from Bearer Authorization header', async () => {
      const token = await signJwt(adminSession);
      const req = createMockRequest('http://localhost:3000/api/admin/metrics', {
        token,
        useHeader: true,
      });

      const extracted = extractAuthToken(req);
      expect(extracted).toBe(token);

      const authResult = await verifyApiAuth(req, ['admin']);
      expect('session' in authResult).toBe(true);
      if ('session' in authResult) {
        expect(authResult.session.role).toBe('admin');
      }
    });

    it('1.7 should verify role hierarchy: Admin can access any role-protected resource', () => {
      expect(hasRolePermission('admin', ['admin'])).toBe(true);
      expect(hasRolePermission('admin', ['cashier'])).toBe(true);
      expect(hasRolePermission('admin', ['kitchen'])).toBe(true);
      expect(hasRolePermission('admin', ['customer'])).toBe(true);
    });

    it('1.8 should verify Cashier can access Cashier and Kitchen scopes', () => {
      expect(hasRolePermission('cashier', ['cashier'])).toBe(true);
      expect(hasRolePermission('cashier', ['kitchen'])).toBe(true);
      expect(hasRolePermission('cashier', ['admin'])).toBe(false);
    });

    it('1.9 should verify Kitchen staff can access only Kitchen scope', () => {
      expect(hasRolePermission('kitchen', ['kitchen'])).toBe(true);
      expect(hasRolePermission('kitchen', ['cashier'])).toBe(false);
      expect(hasRolePermission('kitchen', ['admin'])).toBe(false);
    });

    it('1.10 should verify unsafe payload decoding extracts unverified claims', async () => {
      const token = await signJwt(adminSession);
      const decoded = decodeJwtUnsafe(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(adminSession.userId);
      expect(decoded?.role).toBe('admin');
      expect(decoded?.iss).toBe('mycashier-enterprise');
    });

    it('1.11 should execute POST /api/auth/login with Admin PIN and set session cookie', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'admin', pin: '8888', branchId: 'b-1' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.role).toBe('admin');
      expect(data.token).toBeDefined();

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain(AUTH_COOKIE_NAME);
    });

    it('1.12 should execute POST /api/auth/login with Cashier PIN and return valid token', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'cashier', pin: '1234', branchId: 'b-2' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session.role).toBe('cashier');
      expect(data.session.branchId).toBe('b-2');
    });

    it('1.13 should execute POST /api/auth/login with Kitchen PIN and return valid token', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'kitchen', pin: '5555' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session.role).toBe('kitchen');
    });

    it('1.14 should execute GET /api/auth/me with session cookie', async () => {
      const token = await signJwt(cashierSession);
      const req = createMockRequest('http://localhost:3000/api/auth/me', {
        token,
        useCookie: true,
      });
      const res = await meHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.userId).toBe(cashierSession.userId);
      expect(data.session.role).toBe('cashier');
    });

    it('1.15 should execute POST /api/auth/logout and clear session cookie', async () => {
      const res = await logoutHandler();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      const cookie = res.headers.get('set-cookie');
      expect(cookie).toContain(`${AUTH_COOKIE_NAME}=;`);
    });
  });

  // ==========================================
  // TIER 2: BOUNDARY & ERROR CONDITIONS
  // ==========================================
  describe('Tier 2: Boundary, Error & Security Edge Cases', () => {
    it('2.1 should reject missing authentication token with 401 Unauthorized', async () => {
      const req = createMockRequest('http://localhost:3000/api/store-settings');
      const result = await verifyApiAuth(req, ['admin']);

      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(401);
        const data = await result.errorResponse.json();
        expect(data.code).toBe('UNAUTHORIZED');
      }
    });

    it('2.2 should reject malformed JWT string with 401 Invalid Session', async () => {
      const req = createMockRequest('http://localhost:3000/api/menu', {
        token: 'this.is-not.a-valid-jwt-token',
        useHeader: true,
      });
      const result = await verifyApiAuth(req, ['admin']);

      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(401);
        const data = await result.errorResponse.json();
        expect(data.code).toBe('INVALID_SESSION');
      }
    });

    it('2.3 should reject empty or truncated JWT strings', async () => {
      expect(await verifyJwtEdge('')).toBeNull();
      expect(await verifyJwtEdge('eyJhbGciOiJIUzI1NiJ9')).toBeNull();
      expect(await verifyJwtEdge('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIn0')).toBeNull();
    });

    it('2.4 should reject expired JWT token', async () => {
      const expiredToken = await signJwt(adminSession, -10);
      const verified = await verifyJwtEdge(expiredToken);
      expect(verified).toBeNull();

      const req = createMockRequest('http://localhost:3000/api/admin', {
        token: expiredToken,
        useHeader: true,
      });
      const result = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(401);
      }
    });

    it('2.5 should block Cashier attempting to access Admin-only endpoint with 403 Forbidden', async () => {
      const cashierToken = await signJwt(cashierSession);
      const req = createMockRequest('http://localhost:3000/api/audit-logs', {
        token: cashierToken,
        useCookie: true,
      });

      const result = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(403);
        const data = await result.errorResponse.json();
        expect(data.code).toBe('FORBIDDEN');
      }
    });

    it('2.6 should block Kitchen staff attempting Cashier POS checkout with 403 Forbidden', async () => {
      const kitchenToken = await signJwt(kitchenSession);
      const req = createMockRequest('http://localhost:3000/api/payments/qris', {
        token: kitchenToken,
        useHeader: true,
      });

      const result = await verifyApiAuth(req, ['cashier']);
      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(403);
      }
    });

    it('2.7 should block Customer guest attempting Admin mutation with 403 Forbidden', async () => {
      const guestToken = await signJwt(customerSession);
      const req = createMockRequest('http://localhost:3000/api/store-settings', {
        token: guestToken,
        useCookie: true,
      });

      const result = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in result).toBe(true);
      if ('errorResponse' in result) {
        expect(result.errorResponse.status).toBe(403);
      }
    });

    it('2.8 should reject tampered payload with altered role (HMAC validation failure)', async () => {
      const validToken = await signJwt(cashierSession);
      const [headerB64, payloadB64, signatureB64] = validToken.split('.');

      const payloadObj = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      payloadObj.role = 'admin';
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');

      const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signatureB64}`;
      const verified = await verifyJwtEdge(tamperedToken);
      expect(verified).toBeNull();
    });

    it('2.9 should reject login with invalid PIN on POST /api/auth/login with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'admin', pin: '9999' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('INVALID_PIN');
    });

    it('2.10 should reject login with invalid role on POST /api/auth/login with 400', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'super_hacker', pin: '8888' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('INVALID_ROLE');
    });

    it('2.11 should reject login with missing role parameter with 400', async () => {
      const req = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { pin: '8888' },
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('MISSING_ROLE');
    });
  });

  // ==========================================
  // TIER 3: CROSS-FEATURE & MIDDLEWARE INTEGRATION
  // ==========================================
  describe('Tier 3: Middleware Route Protection & Combinations', () => {
    it('3.1 should redirect unauthenticated request to /admin to home with authRequired=admin', async () => {
      const req = createMockRequest('http://localhost:3000/admin');
      const res = await middleware(req);
      expect(res.status).toBe(307); // NextResponse.redirect
      expect(res.headers.get('location')).toContain('authRequired=admin');
    });

    it('3.2 should redirect cashier requesting /admin to home', async () => {
      const token = await signJwt(cashierSession);
      const req = createMockRequest('http://localhost:3000/admin', {
        token,
        useCookie: true,
      });
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('authRequired=admin');
    });

    it('3.3 should allow admin requesting /admin and inject user headers', async () => {
      const token = await signJwt(adminSession);
      const req = createMockRequest('http://localhost:3000/admin', {
        token,
        useCookie: true,
      });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it('3.4 should block unauthenticated request to /api/audit-logs with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/audit-logs');
      const res = await middleware(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('3.5 should block cashier request to /api/audit-logs with 403', async () => {
      const token = await signJwt(cashierSession);
      const req = createMockRequest('http://localhost:3000/api/audit-logs', {
        token,
        useHeader: true,
      });
      const res = await middleware(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN');
    });

    it('3.6 should allow admin request to /api/audit-logs in middleware', async () => {
      const token = await signJwt(adminSession);
      const req = createMockRequest('http://localhost:3000/api/audit-logs', {
        token,
        useHeader: true,
      });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it('3.7 should allow cashier and admin to access /api/inventory/transfers', async () => {
      const cashierToken = await signJwt(cashierSession);
      const reqCashier = createMockRequest('http://localhost:3000/api/inventory/transfers', {
        token: cashierToken,
        useHeader: true,
      });
      const resCashier = await middleware(reqCashier);
      expect(resCashier.status).toBe(200);

      const adminToken = await signJwt(adminSession);
      const reqAdmin = createMockRequest('http://localhost:3000/api/inventory/transfers', {
        token: adminToken,
        useHeader: true,
      });
      const resAdmin = await middleware(reqAdmin);
      expect(resAdmin.status).toBe(200);
    });

    it('3.8 should block kitchen role from /api/inventory/transfers with 403', async () => {
      const kitchenToken = await signJwt(kitchenSession);
      const req = createMockRequest('http://localhost:3000/api/inventory/transfers', {
        token: kitchenToken,
        useHeader: true,
      });
      const res = await middleware(req);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ==========================================
  describe('Tier 4: Real-World Restaurant Shift & Attack Scenarios', () => {
    it('4.1 should simulate a full multi-staff restaurant shift handover', async () => {
      // 1. Morning Shift: Cashier logs in via API
      const loginReq = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'cashier', pin: '1234', branchId: 'b-1' },
      });
      const loginRes = await loginHandler(loginReq);
      expect(loginRes.status).toBe(200);
      const { token: cashierToken } = await loginRes.json();

      // Cashier checks /api/auth/me
      const meReq = createMockRequest('http://localhost:3000/api/auth/me', {
        token: cashierToken,
        useCookie: true,
      });
      const meRes = await meHandler(meReq);
      expect(meRes.status).toBe(200);

      // Cashier logs out
      const logoutRes = await logoutHandler();
      expect(logoutRes.status).toBe(200);

      // 2. Kitchen Staff logs in
      const kitchenLoginReq = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'kitchen', pin: '5555', branchId: 'b-1' },
      });
      const kitchenRes = await loginHandler(kitchenLoginReq);
      expect(kitchenRes.status).toBe(200);

      // 3. Admin logs in for evening audit
      const adminLoginReq = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'admin', pin: '8888', branchId: 'b-1' },
      });
      const adminRes = await loginHandler(adminLoginReq);
      expect(adminRes.status).toBe(200);
    });

    it('4.2 should simulate brute-force PIN attack resilience', async () => {
      const invalidPins = ['0000', '1111', '9999', '1235', '8887', 'admin', 'pass', '123456'];
      for (const pin of invalidPins) {
        const req = createMockRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: { role: 'admin', pin },
        });
        const res = await loginHandler(req);
        expect(res.status).toBe(401);
      }
    });

    it('4.3 should safely sanitize adversarial and injection payload strings in session', async () => {
      const injectionSession: AuthSession = {
        userId: "usr-1'; DROP TABLE users; --",
        name: '<script>alert("XSS")</script>',
        role: 'cashier',
        branchId: 'b-1" OR "1"="1',
      };

      const token = await signJwt(injectionSession);
      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("usr-1'; DROP TABLE users; --");
      expect(verified?.name).toBe('<script>alert("XSS")</script>');
    });
  });
});
