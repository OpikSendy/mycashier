/**
 * Web Crypto JWT Utility for MyCashier Enterprise & Security Module
 * Fully compatible with Next.js 16 Edge Runtime, Bun, and Node.js.
 * Zero external dependencies (uses native Web Crypto API).
 */

export interface AuthSession {
  userId: string;
  name: string;
  role: 'admin' | 'cashier' | 'kitchen' | 'customer';
  branchId?: string;
}

export interface JwtPayload extends AuthSession {
  sub: string;
  iat: number;
  exp: number;
  iss?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'mycashier-enterprise-rbac-secret-key-2026-super-secure';
const JWT_ISSUER = 'mycashier-enterprise';
const DEFAULT_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

/** Convert string to Uint8Array UTF-8 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert Uint8Array to string UTF-8 */
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

/** Base64URL encode a Uint8Array */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64URL encode a UTF-8 string */
function base64UrlEncodeString(str: string): string {
  return base64UrlEncode(stringToUint8Array(str));
}

/** Base64URL decode to string */
function base64UrlDecodeToString(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return uint8ArrayToString(bytes);
}

/** Base64URL decode to Uint8Array */
function base64UrlDecodeToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Import HMAC-SHA256 CryptoKey */
async function getCryptoKey(secret: string = JWT_SECRET): Promise<CryptoKey> {
  const keyData = stringToUint8Array(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign an AuthSession into a standard HS256 JWT string.
 * @param session User session details
 * @param expiresInSeconds Token lifetime (defaults to 24 hours)
 */
export async function signJwt(
  session: AuthSession,
  expiresInSeconds: number = DEFAULT_EXPIRATION_SECONDS
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    ...session,
    sub: session.userId,
    iat: now,
    exp: now + expiresInSeconds,
    iss: JWT_ISSUER,
  };

  const headerB64 = base64UrlEncodeString(JSON.stringify(header));
  const payloadB64 = base64UrlEncodeString(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToUint8Array(dataToSign).buffer as ArrayBuffer
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verify a JWT string in Edge/Browser/Node runtimes using Web Crypto API.
 * Returns the decoded AuthSession if valid, or null if expired/tampered/invalid.
 */
export async function verifyJwtEdge(token: string): Promise<AuthSession | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // 1. Verify Header
    const headerJson = base64UrlDecodeToString(headerB64);
    const header = JSON.parse(headerJson);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    // 2. Verify Cryptographic Signature
    const dataToSign = `${headerB64}.${payloadB64}`;
    const signatureBytes = base64UrlDecodeToBytes(signatureB64);
    const key = await getCryptoKey();

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes.buffer as ArrayBuffer,
      stringToUint8Array(dataToSign).buffer as ArrayBuffer
    );

    if (!isValid) {
      return null;
    }

    // 3. Verify Payload and Expiry
    const payloadJson = base64UrlDecodeToString(payloadB64);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      // Token expired
      return null;
    }

    if (!payload.userId || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId,
      name: payload.name || payload.userId,
      role: payload.role,
      branchId: payload.branchId || 'b-1',
    };
  } catch {
    return null;
  }
}

/**
 * Decode JWT payload without verifying signature (useful for client inspection).
 */
export function decodeJwtUnsafe(token: string): JwtPayload | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecodeToString(parts[1]);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}
