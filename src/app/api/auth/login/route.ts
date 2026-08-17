import { NextRequest, NextResponse } from 'next/server';
import { signJwt, AuthSession } from '@/lib/jwt';
import { AUTH_COOKIE_NAME, DEFAULT_ROLE_PINS } from '@/lib/auth';
import { UserRole } from '@/context/AppContext';
import { createAuditLog, extractReqMetadata } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, pin, branchId = 'b-1' } = body;
    const { ipAddress, userAgent } = extractReqMetadata(req);

    if (!role) {
      return NextResponse.json(
        { error: 'Role wajib diisi', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['admin', 'cashier', 'kitchen', 'customer'];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Role tidak valid: ${role}`, code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Role-specific PIN verification
    let sessionName = 'User';
    let userId = `usr-${role}-${Date.now().toString(36)}`;

    if (role === 'customer') {
      sessionName = 'Pelanggan';
    } else {
      const expectedPin = DEFAULT_ROLE_PINS[role];
      if (!expectedPin || pin !== expectedPin) {
        // Log failed PIN login attempt
        await createAuditLog({
          userId: `unauth-${role}`,
          userName: 'Unknown Attempt',
          userRole: role,
          actionType: 'LOGIN_FAILURE',
          entityType: 'auth',
          ipAddress,
          userAgent,
          description: `Percobaan login gagal untuk role ${role.toUpperCase()} (PIN salah)`,
          status: 'FAILURE',
        });

        return NextResponse.json(
          {
            error: `PIN untuk role ${role.toUpperCase()} tidak valid.`,
            code: 'INVALID_PIN',
          },
          { status: 401 }
        );
      }

      if (role === 'admin') {
        sessionName = 'Store Admin';
      } else if (role === 'cashier') {
        sessionName = 'Kasir Utama';
      } else if (role === 'kitchen') {
        sessionName = 'Chef Dapur';
      }
    }

    const session: AuthSession = {
      userId,
      name: sessionName,
      role: role as UserRole,
      branchId,
    };

    // Sign JWT
    const token = await signJwt(session, 60 * 60 * 24); // 24 hours

    // Record successful login audit log
    await createAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      actionType: 'USER_LOGIN',
      entityType: 'auth',
      ipAddress,
      userAgent,
      description: `Autentikasi berhasil sebagai ${session.name} (${session.role}) di cabang ${branchId}`,
      newPayload: { branchId, role: session.role },
      status: 'SUCCESS',
    });

    const response = NextResponse.json({
      success: true,
      message: `Berhasil masuk sebagai ${sessionName}`,
      session,
      token,
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat login', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

