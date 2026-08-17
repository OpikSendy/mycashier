import { describe, it, expect, beforeEach } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET as getTransfers, POST as postTransfer } from '../../src/app/api/inventory/transfers/route';
import { GET as getTransferById, PATCH as patchTransferById } from '../../src/app/api/inventory/transfers/[id]/route';
import { GET as getAuditLogsRoute, POST as postAuditLogRoute } from '../../src/app/api/audit-logs/route';
import { inventoryEngine } from '../../src/lib/inventoryEngine';
import { globalAuditRepo } from '../../src/lib/audit';

function createJsonRequest(url: string, method: string, body?: any, headers?: Record<string, string>) {
  const reqHeaders = new Headers(headers || {});
  if (body) reqHeaders.set('Content-Type', 'application/json');
  return new NextRequest(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('API Route Adversarial Challenge Suite (tests/challenger-2/adversarial-api-routes.test.ts)', () => {
  beforeEach(() => {
    inventoryEngine.seedDefaults();
  });

  describe('Inter-Branch Transfers API (/api/inventory/transfers)', () => {
    it('POST /api/inventory/transfers rejects missing or invalid body parameters', async () => {
      // Missing source/dest
      const req1 = createJsonRequest('http://localhost:3000/api/inventory/transfers', 'POST', {
        items: [{ itemId: 'inv-coffee', quantity: 10, unit: 'kg' }],
      });
      const res1 = await postTransfer(req1);
      expect(res1.status).toBe(400);

      // Empty items array
      const req2 = createJsonRequest('http://localhost:3000/api/inventory/transfers', 'POST', {
        sourceBranchId: 'b-1',
        destBranchId: 'b-2',
        items: [],
      });
      const res2 = await postTransfer(req2);
      expect(res2.status).toBe(400);

      // Self transfer attempt
      const req3 = createJsonRequest('http://localhost:3000/api/inventory/transfers', 'POST', {
        sourceBranchId: 'b-1',
        destBranchId: 'b-1',
        items: [{ itemId: 'inv-coffee', quantity: 5, unit: 'kg' }],
      });
      const res3 = await postTransfer(req3);
      expect(res3.status).toBe(400);
      const json3 = await res3.json();
      expect(json3.error).toContain('Self-transfer is forbidden');
    });

    it('POST & PATCH lifecycle through HTTP API route endpoints', async () => {
      // 1. Create transfer via POST
      const createReq = createJsonRequest('http://localhost:3000/api/inventory/transfers', 'POST', {
        sourceBranchId: 'b-1',
        destBranchId: 'b-3',
        items: [{ itemId: 'inv-milk', quantity: 20, unit: 'liter' }],
        requestedBy: 'Bali Supervisor',
      });
      const createRes = await postTransfer(createReq);
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      const transferId = createData.data.id;

      // 2. GET single transfer by ID
      const getSingleReq = new NextRequest(`http://localhost:3000/api/inventory/transfers/${transferId}`);
      const getSingleRes = await getTransferById(getSingleReq, { params: Promise.resolve({ id: transferId }) });
      expect(getSingleRes.status).toBe(200);
      const singleData = await getSingleRes.json();
      expect(singleData.data.status).toBe('PENDING');

      // 3. Reject non-admin approval
      const nonAdminReq = createJsonRequest(`http://localhost:3000/api/inventory/transfers/${transferId}`, 'PATCH', {
        action: 'APPROVE',
        userRole: 'cashier',
      });
      const nonAdminRes = await patchTransferById(nonAdminReq, { params: Promise.resolve({ id: transferId }) });
      expect(nonAdminRes.status).toBe(403);

      // 4. Admin APPROVE
      const approveReq = createJsonRequest(`http://localhost:3000/api/inventory/transfers/${transferId}`, 'PATCH', {
        action: 'APPROVE',
        userRole: 'admin',
        userId: 'admin-owner',
      });
      const approveRes = await patchTransferById(approveReq, { params: Promise.resolve({ id: transferId }) });
      expect(approveRes.status).toBe(200);

      // 5. SHIP
      const shipReq = createJsonRequest(`http://localhost:3000/api/inventory/transfers/${transferId}`, 'PATCH', {
        action: 'SHIP',
      });
      const shipRes = await patchTransferById(shipReq, { params: Promise.resolve({ id: transferId }) });
      expect(shipRes.status).toBe(200);

      // 6. COMPLETE
      const completeReq = createJsonRequest(`http://localhost:3000/api/inventory/transfers/${transferId}`, 'PATCH', {
        action: 'COMPLETE',
        userId: 'bali-receiver',
      });
      const completeRes = await patchTransferById(completeReq, { params: Promise.resolve({ id: transferId }) });
      expect(completeRes.status).toBe(200);

      // Verify stock balances
      expect(inventoryEngine.getStock('b-1', 'inv-milk')).toBe(80); // 100 - 20
      expect(inventoryEngine.getStock('b-3', 'inv-milk')).toBe(30); // 10 + 20
    });

    it('PATCH /api/inventory/transfers/[id] with non-existent transfer ID returns 404', async () => {
      const nonExistentReq = createJsonRequest('http://localhost:3000/api/inventory/transfers/trf-99999', 'PATCH', {
        action: 'APPROVE',
        userRole: 'admin',
      });
      const res = await patchTransferById(nonExistentReq, { params: Promise.resolve({ id: 'trf-99999' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('Security Audit Logs API (/api/audit-logs)', () => {
    it('GET /api/audit-logs with format=csv returns downloadable CSV stream', async () => {
      const req = new NextRequest('http://localhost:3000/api/audit-logs?format=csv');
      const res = await getAuditLogsRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      expect(res.headers.get('content-disposition')).toContain('attachment');

      const csvText = await res.text();
      expect(csvText).toContain('ID,Timestamp,User ID,User Name,Role,Action,Entity Type,Entity ID,Status,IP Address,Description');
    });

    it('POST /api/audit-logs creates an audit record with IP extraction', async () => {
      const req = createJsonRequest(
        'http://localhost:3000/api/audit-logs',
        'POST',
        {
          userId: 'usr-audit-test',
          userName: 'Security Test Agent',
          userRole: 'admin',
          actionType: 'SECURITY_SCAN',
          entityType: 'system',
          description: 'Adversarial security audit probe',
          newPayload: { scanScore: 100 },
        },
        {
          'x-forwarded-for': '203.0.113.195',
          'user-agent': 'AdversarialTestRunner/1.0',
        }
      );

      const res = await postAuditLogRoute(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.log.ipAddress).toBe('203.0.113.195');
      expect(json.log.userAgent).toBe('AdversarialTestRunner/1.0');
    });

    it('POST /api/audit-logs validates required parameters', async () => {
      const req = createJsonRequest('http://localhost:3000/api/audit-logs', 'POST', {
        userId: 'incomplete-entry',
      });
      const res = await postAuditLogRoute(req);
      expect(res.status).toBe(400);
    });
  });
});
