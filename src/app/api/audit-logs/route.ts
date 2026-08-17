import { NextRequest, NextResponse } from 'next/server';
import {
  getAuditLogs,
  createAuditLog,
  formatAuditLogsCsv,
  extractReqMetadata,
  AuditLogFilters,
} from '@/lib/audit';

/**
 * GET /api/audit-logs
 * Lists audit logs with multi-parameter filtering, search, pagination, and CSV export.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const actionType = searchParams.get('actionType') || undefined;
    const userRole = searchParams.get('userRole') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const status = (searchParams.get('status') as 'SUCCESS' | 'FAILURE') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    const format = searchParams.get('format') || 'json';

    const filters: AuditLogFilters = {
      search,
      actionType,
      userRole,
      entityType,
      status,
      startDate,
      endDate,
      limit,
      offset,
    };

    const result = await getAuditLogs(filters);

    if (format === 'csv') {
      const csvData = formatAuditLogsCsv(result.logs);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: result.total,
      logs: result.logs,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[GET /api/audit-logs] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit-logs
 * Manually record an audit log event.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ipAddress, userAgent } = extractReqMetadata(req);

    if (!body.userId || !body.userRole || !body.actionType || !body.entityType || !body.description) {
      return NextResponse.json(
        {
          error: 'Missing required audit fields: userId, userRole, actionType, entityType, description',
        },
        { status: 400 }
      );
    }

    const log = await createAuditLog({
      userId: body.userId,
      userName: body.userName || body.userId,
      userRole: body.userRole,
      actionType: body.actionType,
      entityType: body.entityType,
      entityId: body.entityId,
      ipAddress: body.ipAddress || ipAddress,
      userAgent: body.userAgent || userAgent,
      description: body.description,
      oldPayload: body.oldPayload,
      newPayload: body.newPayload,
      status: body.status || 'SUCCESS',
    });

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/audit-logs] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to record audit log', details: error.message },
      { status: 500 }
    );
  }
}
