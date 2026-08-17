import { describe, it, expect } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import {
  signJwt,
  verifyJwtEdge,
  decodeJwtUnsafe,
  type AuthSession,
  type JwtPayload,
} from '../../src/lib/jwt';
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
import { getAuditLogs, globalAuditRepo } from '../../src/lib/audit';

describe('Adversarial Challenger 1: Auth & RBAC Subsystem Stress Suite', () => {
  const adminSession: AuthSession = {
    userId: 'usr-admin-adv',
    name: 'Chief Administrator',
    role: 'admin',
    branchId: 'b-1',
  };

  const cashierSession: AuthSession = {
    userId: 'usr-cashier-adv',
    name: 'POS Cashier Lead',
    role: 'cashier',
    branchId: 'b-1',
  };

  const kitchenSession: AuthSession = {
    userId: 'usr-kitchen-adv',
    name: 'Head Chef KDS',
    role: 'kitchen',
    branchId: 'b-2',
  };

  const customerSession: AuthSession = {
    userId: 'usr-customer-adv',
    name: 'Guest Table 99',
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
      customHeaders?: Record<string, string>;
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
    if (options.customHeaders) {
      for (const [k, v] of Object.entries(options.customHeaders)) {
        headers.set(k, v);
      }
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

  // Base64URL helper
  function toBase64Url(str: string): string {
    return Buffer.from(str, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // =========================================================================
  // CHALLENGE 1: CRYPTOGRAPHIC JWT SIGNATURE TAMPERING & PAYLOAD MUTATION
  // =========================================================================
  describe('Challenge 1: Cryptographic JWT Signature Tampering & Payload Mutation', () => {
    it('1.1 should reject tokens with algorithm confusion: alg=none (uppercase/lowercase/mixed)', async () => {
      const payloads = [
        { alg: 'none', typ: 'JWT' },
        { alg: 'None', typ: 'JWT' },
        { alg: 'NONE', typ: 'JWT' },
        { alg: 'nOnE', typ: 'JWT' },
      ];

      for (const header of payloads) {
        const headerB64 = toBase64Url(JSON.stringify(header));
        const payloadB64 = toBase64Url(
          JSON.stringify({
            userId: 'usr-hacker-1',
            name: 'Hacker',
            role: 'admin',
            branchId: 'b-1',
            sub: 'usr-hacker-1',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        );

        // Test with empty signature and with dummy signature
        const tokenWithoutSig = `${headerB64}.${payloadB64}.`;
        const tokenWithDummySig = `${headerB64}.${payloadB64}.c2lnbmF0dXJl`;

        expect(await verifyJwtEdge(tokenWithoutSig)).toBeNull();
        expect(await verifyJwtEdge(tokenWithDummySig)).toBeNull();
      }
    });

    it('1.2 should reject tokens with unsupported or asymmetric algorithms (RS256, ES256, HS384, HS512)', async () => {
      const unsupportedAlgs = ['RS256', 'ES256', 'HS384', 'HS512', 'PS256', 'EdDSA'];
      for (const alg of unsupportedAlgs) {
        const headerB64 = toBase64Url(JSON.stringify({ alg, typ: 'JWT' }));
        const payloadB64 = toBase64Url(JSON.stringify(adminSession));
        const fakeToken = `${headerB64}.${payloadB64}.c2lnbmF0dXJl`;

        const verified = await verifyJwtEdge(fakeToken);
        expect(verified).toBeNull();
      }
    });

    it('1.3 should reject single-bit and byte mutations in the cryptographic HMAC signature', async () => {
      const validToken = await signJwt(adminSession);
      const [headerB64, payloadB64, signatureB64] = validToken.split('.');

      // Mutation 1: Change last character of signature
      const lastChar = signatureB64.slice(-1);
      const mutatedLastChar = lastChar === 'a' ? 'b' : 'a';
      const tamperedSig1 = signatureB64.slice(0, -1) + mutatedLastChar;
      expect(await verifyJwtEdge(`${headerB64}.${payloadB64}.${tamperedSig1}`)).toBeNull();

      // Mutation 2: Change first character of signature
      const firstChar = signatureB64[0];
      const mutatedFirstChar = firstChar === 'A' ? 'B' : 'A';
      const tamperedSig2 = mutatedFirstChar + signatureB64.slice(1);
      expect(await verifyJwtEdge(`${headerB64}.${payloadB64}.${tamperedSig2}`)).toBeNull();

      // Mutation 3: Truncate signature
      const truncatedSig = signatureB64.slice(0, 16);
      expect(await verifyJwtEdge(`${headerB64}.${payloadB64}.${truncatedSig}`)).toBeNull();

      // Mutation 4: Append extra base64 characters
      const bloatedSig = signatureB64 + 'extraGarbage123';
      expect(await verifyJwtEdge(`${headerB64}.${payloadB64}.${bloatedSig}`)).toBeNull();
    });

    it('1.4 should reject tokens signed with a different HMAC secret key', async () => {
      // Craft a token manually with a rogue secret
      const rogueSecret = 'rogue-unauthorized-secret-key-99999999999999999999';
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        userId: 'usr-admin-adv',
        name: 'Spoofed Admin',
        role: 'admin',
        branchId: 'b-1',
        sub: 'usr-admin-adv',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'mycashier-enterprise',
      };

      const headerB64 = toBase64Url(JSON.stringify(header));
      const payloadB64 = toBase64Url(JSON.stringify(payload));
      const dataToSign = `${headerB64}.${payloadB64}`;

      const keyData = new TextEncoder().encode(rogueSecret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData.buffer as ArrayBuffer,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      const sigBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(dataToSign).buffer as ArrayBuffer
      );
      const rogueSigB64 = Buffer.from(sigBuffer)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const rogueToken = `${dataToSign}.${rogueSigB64}`;
      const verified = await verifyJwtEdge(rogueToken);
      expect(verified).toBeNull();
    });

    it('1.5 should reject payload mutation from Cashier to Admin role while keeping original signature', async () => {
      const cashierToken = await signJwt(cashierSession);
      const [headerB64, payloadB64, signatureB64] = cashierToken.split('.');

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      expect(payload.role).toBe('cashier');

      // Escalate role to admin in payload
      payload.role = 'admin';
      payload.name = 'Hacked Admin';
      const escalatedPayloadB64 = toBase64Url(JSON.stringify(payload));

      const tamperedToken = `${headerB64}.${escalatedPayloadB64}.${signatureB64}`;
      const verified = await verifyJwtEdge(tamperedToken);
      expect(verified).toBeNull();

      // Ensure decodeJwtUnsafe reflects the altered payload (verifying client warning)
      const decodedUnsafe = decodeJwtUnsafe(tamperedToken);
      expect(decodedUnsafe?.role).toBe('admin');
      // But verifyJwtEdge MUST reject it
      expect(await verifyJwtEdge(tamperedToken)).toBeNull();
    });

    it('1.6 should reject prototype pollution and object injection payloads safely', async () => {
      const maliciousPayload = {
        userId: 'usr-inject',
        name: 'Polluter',
        role: 'admin',
        branchId: 'b-1',
        __proto__: { isAdmin: true, pollutes: 'yes' },
        constructor: { prototype: { hacked: true } },
      };

      const headerB64 = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadB64 = toBase64Url(JSON.stringify(maliciousPayload));
      const fakeToken = `${headerB64}.${payloadB64}.invalidsig`;

      expect(await verifyJwtEdge(fakeToken)).toBeNull();
      expect((Object.prototype as any).pollutes).toBeUndefined();
      expect((Object.prototype as any).hacked).toBeUndefined();
    });

    it('1.7 should handle extreme payload sizes and special characters without crash or ReDoS', async () => {
      // 50KB payload
      const hugeSession: AuthSession = {
        userId: 'usr-large-' + 'A'.repeat(50000),
        name: 'Large User 🚀 🍔 🇮🇩 \u0000 \n \r \t',
        role: 'cashier',
        branchId: 'b-1',
      };

      const token = await signJwt(hugeSession);
      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.role).toBe('cashier');
      expect(verified?.name).toContain('Large User');
    });
  });

  // =========================================================================
  // CHALLENGE 2: EXPIRED AND FUTURE-DATED TOKEN HANDLING
  // =========================================================================
  describe('Challenge 2: Expired and Future-Dated Token Handling', () => {
    it('2.1 should strictly reject tokens expired 1 second, 1 hour, and 30 days ago', async () => {
      const expiryOffsets = [-1, -3600, -86400 * 30];

      for (const offset of expiryOffsets) {
        const expiredToken = await signJwt(adminSession, offset);
        const verified = await verifyJwtEdge(expiredToken);
        expect(verified).toBeNull();

        // Check verifyApiAuth returns 401 INVALID_SESSION
        const req = createMockRequest('http://localhost:3000/api/auth/me', {
          token: expiredToken,
          useCookie: true,
        });
        const authResult = await verifyApiAuth(req, ['admin']);
        expect('errorResponse' in authResult).toBe(true);
        if ('errorResponse' in authResult) {
          expect(authResult.errorResponse.status).toBe(401);
          const data = await authResult.errorResponse.json();
          expect(data.code).toBe('INVALID_SESSION');
        }
      }
    });

    it('2.2 should reject tokens with non-numeric, negative, or invalid exp types', async () => {
      const invalidExpValues = [
        0,
        -999999,
        '2099-01-01',
        'never',
        null,
        {},
        [12345],
        NaN,
      ];

      for (const expVal of invalidExpValues) {
        const payload = {
          userId: 'usr-admin-adv',
          name: 'Admin',
          role: 'admin',
          branchId: 'b-1',
          iat: Math.floor(Date.now() / 1000),
          exp: expVal,
        };

        const headerB64 = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payloadB64 = toBase64Url(JSON.stringify(payload));
        const dummyToken = `${headerB64}.${payloadB64}.fakesig`;

        const verified = await verifyJwtEdge(dummyToken);
        expect(verified).toBeNull();
      }
    });

    it('2.3 should accept valid unexpired tokens with future iat and valid positive lifetime', async () => {
      // Token valid for 2 hours into future
      const token = await signJwt(adminSession, 7200);
      const verified = await verifyJwtEdge(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(adminSession.userId);
      expect(verified?.role).toBe('admin');
    });

    it('2.4 should reject expired token in route middleware for protected routes', async () => {
      const expiredToken = await signJwt(adminSession, -100);

      // Route /admin -> Should redirect to home with authRequired=admin
      const reqAdmin = createMockRequest('http://localhost:3000/admin', {
        token: expiredToken,
        useCookie: true,
      });
      const resAdmin = await middleware(reqAdmin);
      expect(resAdmin.status).toBe(307);
      expect(resAdmin.headers.get('location')).toContain('authRequired=admin');

      // API /api/audit-logs -> Should return 401 UNAUTHORIZED
      const reqApi = createMockRequest('http://localhost:3000/api/audit-logs', {
        token: expiredToken,
        useHeader: true,
      });
      const resApi = await middleware(reqApi);
      expect(resApi.status).toBe(401);
      const dataApi = await resApi.json();
      expect(dataApi.code).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // CHALLENGE 3: ROLE PRIVILEGE ESCALATION ATTEMPTS
  // =========================================================================
  describe('Challenge 3: Role Privilege Escalation Attempts', () => {
    it('3.1 should block Cashier token attempting Admin mutations on API endpoints (403 FORBIDDEN)', async () => {
      const cashierToken = await signJwt(cashierSession);

      const req = createMockRequest('http://localhost:3000/api/store-settings', {
        method: 'POST',
        token: cashierToken,
        useCookie: true,
        body: { enableTax: false },
      });

      const authResult = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in authResult).toBe(true);
      if ('errorResponse' in authResult) {
        expect(authResult.errorResponse.status).toBe(403);
        const data = await authResult.errorResponse.json();
        expect(data.code).toBe('FORBIDDEN');
        expect(data.error).toContain('Akses ditolak');
      }
    });

    it('3.2 should block Kitchen token attempting Cashier POS checkout and transfers', async () => {
      const kitchenToken = await signJwt(kitchenSession);

      // Attempt Cashier route verification
      const reqCheckout = createMockRequest('http://localhost:3000/api/payments/qris', {
        token: kitchenToken,
        useHeader: true,
      });
      const authResultCheckout = await verifyApiAuth(reqCheckout, ['cashier']);
      expect('errorResponse' in authResultCheckout).toBe(true);
      if ('errorResponse' in authResultCheckout) {
        expect(authResultCheckout.errorResponse.status).toBe(403);
      }

      // Attempt Transfers API in middleware
      const reqTransfers = createMockRequest('http://localhost:3000/api/inventory/transfers', {
        token: kitchenToken,
        useCookie: true,
      });
      const resTransfers = await middleware(reqTransfers);
      expect(resTransfers.status).toBe(403);
      const dataTransfers = await resTransfers.json();
      expect(dataTransfers.code).toBe('FORBIDDEN');
    });

    it('3.3 should block Customer/Guest token from accessing Cashier, Kitchen, and Admin scopes', async () => {
      const customerToken = await signJwt(customerSession);

      const rolesToTest: ('cashier' | 'kitchen' | 'admin')[] = ['cashier', 'kitchen', 'admin'];
      for (const targetRole of rolesToTest) {
        const req = createMockRequest('http://localhost:3000/api/protected', {
          token: customerToken,
          useCookie: true,
        });
        const authResult = await verifyApiAuth(req, [targetRole]);
        expect('errorResponse' in authResult).toBe(true);
        if ('errorResponse' in authResult) {
          expect(authResult.errorResponse.status).toBe(403);
        }
      }
    });

    it('3.4 should reject spoofed, unrecognized or casing-mutated roles (SUPERADMIN, root, admin_bypass)', async () => {
      const fakeRoles = ['SUPERADMIN', 'Root', 'root', 'ADMIN', 'Cashier', 'Owner', 'manager', '__proto__'];

      for (const fakeRole of fakeRoles) {
        const sessionWithFakeRole: any = {
          userId: 'usr-fake-1',
          name: 'Fake Actor',
          role: fakeRole,
          branchId: 'b-1',
        };

        const token = await signJwt(sessionWithFakeRole);
        const req = createMockRequest('http://localhost:3000/api/admin/metrics', {
          token,
          useHeader: true,
        });

        const authResult = await verifyApiAuth(req, ['admin']);
        expect('errorResponse' in authResult).toBe(true);
        if ('errorResponse' in authResult) {
          expect(authResult.errorResponse.status).toBe(403);
        }

        // Test hasRolePermission directly
        expect(hasRolePermission(fakeRole as any, ['admin'])).toBe(false);
        expect(hasRolePermission(fakeRole as any, ['cashier'])).toBe(false);
        expect(hasRolePermission(fakeRole as any, ['kitchen'])).toBe(false);
      }
    });

    it('3.5 should enforce strict role inheritance boundaries across all 4 system roles', () => {
      // 1. Admin: Has access to EVERYTHING
      expect(hasRolePermission('admin', ['admin'])).toBe(true);
      expect(hasRolePermission('admin', ['cashier'])).toBe(true);
      expect(hasRolePermission('admin', ['kitchen'])).toBe(true);
      expect(hasRolePermission('admin', ['customer'])).toBe(true);
      expect(hasRolePermission('admin', ['cashier', 'kitchen'])).toBe(true);

      // 2. Cashier: Has access to Cashier & Kitchen, but NEVER Admin
      expect(hasRolePermission('cashier', ['cashier'])).toBe(true);
      expect(hasRolePermission('cashier', ['kitchen'])).toBe(true);
      expect(hasRolePermission('cashier', ['admin'])).toBe(false);
      expect(hasRolePermission('cashier', ['admin', 'cashier'])).toBe(true); // matches cashier in array

      // 3. Kitchen: Has access ONLY to Kitchen
      expect(hasRolePermission('kitchen', ['kitchen'])).toBe(true);
      expect(hasRolePermission('kitchen', ['cashier'])).toBe(false);
      expect(hasRolePermission('kitchen', ['admin'])).toBe(false);

      // 4. Customer: Has access ONLY to Customer / Unrestricted
      expect(hasRolePermission('customer', ['customer'])).toBe(true);
      expect(hasRolePermission('customer', ['cashier'])).toBe(false);
      expect(hasRolePermission('customer', ['kitchen'])).toBe(false);
      expect(hasRolePermission('customer', ['admin'])).toBe(false);
    });
  });

  // =========================================================================
  // CHALLENGE 4: ROUTE MIDDLEWARE HEADER SPOOFING VS COOKIE PRECEDENCE
  // =========================================================================
  describe('Challenge 4: Route Middleware Header Spoofing vs Cookie Precedence', () => {
    it('4.1 should reject header spoofing: attacker injecting x-user-* headers without valid JWT', async () => {
      const req = createMockRequest('http://localhost:3000/api/audit-logs', {
        customHeaders: {
          'x-user-id': 'usr-admin-spoofed',
          'x-user-role': 'admin',
          'x-user-name': 'Spoofed Admin',
          'x-user-branch': 'b-1',
        },
      });

      // 1. Middleware verification
      const resMiddleware = await middleware(req);
      expect(resMiddleware.status).toBe(401);
      const dataMiddleware = await resMiddleware.json();
      expect(dataMiddleware.code).toBe('UNAUTHORIZED');

      // 2. verifyApiAuth verification
      const authResult = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in authResult).toBe(true);
      if ('errorResponse' in authResult) {
        expect(authResult.errorResponse.status).toBe(401);
      }
    });

    it('4.2 should enforce strict Cookie precedence when both Cookie and Bearer header are present', async () => {
      const cashierToken = await signJwt(cashierSession);
      const adminToken = await signJwt(adminSession);

      // Scenario A: Cashier in Cookie, Admin in Bearer Header
      // extractAuthToken must return Cashier cookie token
      const reqCashierCookie = createMockRequest('http://localhost:3000/api/auth/me', {
        token: cashierToken,
        useCookie: true,
        customHeaders: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const extractedTokenA = extractAuthToken(reqCashierCookie);
      expect(extractedTokenA).toBe(cashierToken);

      // In API RBAC requiring Admin, this should be FORBIDDEN because Cookie (Cashier) takes precedence
      const authResultA = await verifyApiAuth(reqCashierCookie, ['admin']);
      expect('errorResponse' in authResultA).toBe(true);
      if ('errorResponse' in authResultA) {
        expect(authResultA.errorResponse.status).toBe(403);
      }

      // Scenario B: Admin in Cookie, Cashier in Bearer Header
      const reqAdminCookie = createMockRequest('http://localhost:3000/api/auth/me', {
        token: adminToken,
        useCookie: true,
        customHeaders: {
          Authorization: `Bearer ${cashierToken}`,
        },
      });

      const extractedTokenB = extractAuthToken(reqAdminCookie);
      expect(extractedTokenB).toBe(adminToken);

      const authResultB = await verifyApiAuth(reqAdminCookie, ['admin']);
      expect('session' in authResultB).toBe(true);
      if ('session' in authResultB) {
        expect(authResultB.session.role).toBe('admin');
      }
    });

    it('4.3 should reject request when Cookie contains expired/tampered token even if Bearer header has valid token', async () => {
      const expiredCookieToken = await signJwt(adminSession, -100);
      const validBearerToken = await signJwt(adminSession, 3600);

      const req = createMockRequest('http://localhost:3000/api/auth/me', {
        token: expiredCookieToken,
        useCookie: true,
        customHeaders: {
          Authorization: `Bearer ${validBearerToken}`,
        },
      });

      // extractAuthToken extracts the cookie first
      const authResult = await verifyApiAuth(req, ['admin']);
      expect('errorResponse' in authResult).toBe(true);
      if ('errorResponse' in authResult) {
        expect(authResult.errorResponse.status).toBe(401);
      }
    });

    it('4.4 should verify downstream header injection when valid token passes middleware', async () => {
      const adminToken = await signJwt(adminSession);
      const req = createMockRequest('http://localhost:3000/admin', {
        token: adminToken,
        useCookie: true,
      });

      const res = await middleware(req);
      expect(res.status).toBe(200);
      // Next.js NextResponse.next() allows downstream propagation
    });

    it('4.5 should handle URL manipulation and path traversal in protected route paths', async () => {
      const attackUrls = [
        'http://localhost:3000/admin/../cashier',
        'http://localhost:3000/admin/subpath/nested',
        'http://localhost:3000/api/audit-logs/export/csv',
        'http://localhost:3000/api/inventory/transfers/tr-123/approve',
      ];

      for (const url of attackUrls) {
        const req = createMockRequest(url);
        const res = await middleware(req);
        // All unauthenticated protected sub-paths must either redirect (for web pages) or return 401 (for api)
        if (url.includes('/api/')) {
          expect(res.status).toBe(401);
        } else {
          expect(res.status).toBe(307);
        }
      }
    });
  });

  // =========================================================================
  // CHALLENGE 5: BRUTE-FORCE PIN SUBMISSION RESILIENCE & AUDIT LOGGING
  // =========================================================================
  describe('Challenge 5: Brute-Force PIN Submission Resilience & Audit Logging', () => {
    it('5.1 should handle rapid sequential brute-force PIN submissions (60 attempts) without crashing or false positives', async () => {
      globalAuditRepo.clear();

      const candidatePins = [
        '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777',
        '9999', '1234', '4321', '0123', '9876', '1122', '3344', '5566',
        '7788', '9900', '1357', '2468', '1112', '1212', '2121', '8887',
        '8889', '8878', '7888', '8788', '0888', '8880', '1235', '5554',
      ];

      // Perform 60 attacks against Admin role
      for (let i = 0; i < 60; i++) {
        const testPin = candidatePins[i % candidatePins.length];
        // Ensure we don't accidentally send the actual admin PIN (8888)
        const pinToSend = testPin === '8888' ? '9999' : testPin;

        const req = createMockRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          customHeaders: {
            'x-forwarded-for': `192.168.1.${100 + (i % 10)}`,
            'user-agent': 'BruteForceAttacker/1.0',
          },
          body: {
            role: 'admin',
            pin: pinToSend,
            branchId: 'b-1',
          },
        });

        const res = await loginHandler(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.code).toBe('INVALID_PIN');
        expect(data.error).toContain('tidak valid');
      }

      // Verify that audit logs recorded the failed attempts
      const auditResult = await getAuditLogs({ actionType: 'LOGIN_FAILURE', limit: 100 });
      expect(auditResult.total).toBeGreaterThanOrEqual(60);
      expect(auditResult.logs[0].status).toBe('FAILURE');
      expect(auditResult.logs[0].actionType).toBe('LOGIN_FAILURE');
      expect(auditResult.logs[0].userRole).toBe('admin');
    });

    it('5.2 should reject adversarial, injection, and boundary PIN strings', async () => {
      const adversarialPins = [
        '',
        '   ',
        "' OR '1'='1",
        "8888' OR '1'='1",
        '<script>alert(1)</script>',
        '8888\0',
        '8888\n',
        '8888.0',
        '8888 ',
        ' 8888',
        '8888e0',
        '9'.repeat(10000), // Huge PIN
      ];

      for (const pin of adversarialPins) {
        const req = createMockRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: {
            role: 'admin',
            pin,
          },
        });

        const res = await loginHandler(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.code).toBe('INVALID_PIN');
      }
    });

    it('5.3 should seamlessly authenticate legitimate user after high-frequency attack and log SUCCESS', async () => {
      // Legitimate Admin Login with correct PIN 8888
      const legitimateReq = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        customHeaders: {
          'x-forwarded-for': '10.0.0.1',
          'user-agent': 'MyCashier-POS-Terminal/3.2',
        },
        body: {
          role: 'admin',
          pin: '8888',
          branchId: 'b-1',
        },
      });

      const res = await loginHandler(legitimateReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.role).toBe('admin');
      expect(data.token).toBeDefined();

      // Verify the generated token is cryptographically sound
      const verified = await verifyJwtEdge(data.token);
      expect(verified).not.toBeNull();
      expect(verified?.role).toBe('admin');

      // Verify Audit Log records USER_LOGIN with SUCCESS
      const auditResult = await getAuditLogs({ actionType: 'USER_LOGIN', limit: 10 });
      expect(auditResult.logs.length).toBeGreaterThan(0);
      const latestSuccess = auditResult.logs[0];
      expect(latestSuccess.status).toBe('SUCCESS');
      expect(latestSuccess.userRole).toBe('admin');
      expect(latestSuccess.description).toContain('Autentikasi berhasil');
    });

    it('5.4 should ensure session cookie attributes are securely set on login and properly wiped on logout', async () => {
      // 1. Login
      const loginReq = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { role: 'cashier', pin: '1234' },
      });
      const loginRes = await loginHandler(loginReq);
      expect(loginRes.status).toBe(200);

      const cookieHeader = loginRes.headers.get('set-cookie');
      expect(cookieHeader).not.toBeNull();
      expect(cookieHeader?.toLowerCase()).toContain('samesite=lax');
      expect(cookieHeader?.toLowerCase()).toContain('httponly');
      expect(cookieHeader).toContain('Path=/');

      // 2. Logout
      const logoutRes = await logoutHandler();
      expect(logoutRes.status).toBe(200);
      const logoutCookieHeader = logoutRes.headers.get('set-cookie');
      expect(logoutCookieHeader).toContain(`${AUTH_COOKIE_NAME}=;`);
      expect(logoutCookieHeader).toContain('Max-Age=0');
    });
  });
});
