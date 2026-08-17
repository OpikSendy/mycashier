import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
import { CashRoundingRule } from '@/lib/taxEngine';
import { createAuditLog, extractReqMetadata } from '@/lib/audit';

export interface StoreSettingsData {
  id?: number;
  name: string;
  logoUrl: string;
  address: string;
  taxRate: number;
  serviceChargeRate: number;
  enableTax: boolean;
  enableServiceCharge: boolean;
  cashRoundingRule: CashRoundingRule;
}

const DEFAULT_SETTINGS: StoreSettingsData = {
  id: 1,
  name: 'MyCashier Resto',
  logoUrl: '/icon.jpg',
  address: 'Jl. Raya No. 1, Jakarta',
  taxRate: 10,
  serviceChargeRate: 5,
  enableTax: true,
  enableServiceCharge: true,
  cashRoundingRule: 'NONE',
};

// In-memory fallback storage when PostgreSQL is not configured
let inMemorySettings: StoreSettingsData = { ...DEFAULT_SETTINGS };

/**
 * GET /api/store-settings
 * Returns store configuration. Fallback to in-memory state if DB not configured.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ source: 'fallback', data: inMemorySettings });
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id,
        name,
        logo_url AS "logoUrl",
        address,
        tax_rate AS "taxRate",
        COALESCE(service_charge_rate, 5.00) AS "serviceChargeRate",
        COALESCE(enable_tax, true) AS "enableTax",
        COALESCE(enable_service_charge, true) AS "enableServiceCharge",
        COALESCE(cash_rounding_rule, 'NONE') AS "cashRoundingRule"
      FROM store_settings
      LIMIT 1
    `) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ source: 'database', data: DEFAULT_SETTINGS });
    }

    const row = rows[0];
    const data: StoreSettingsData = {
      id: row.id ?? 1,
      name: row.name ?? DEFAULT_SETTINGS.name,
      logoUrl: row.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
      address: row.address ?? DEFAULT_SETTINGS.address,
      taxRate: Number(row.taxRate ?? 10),
      serviceChargeRate: Number(row.serviceChargeRate ?? 5),
      enableTax: row.enableTax !== false && row.enableTax !== 'false',
      enableServiceCharge: row.enableServiceCharge !== false && row.enableServiceCharge !== 'false',
      cashRoundingRule: (row.cashRoundingRule as CashRoundingRule) || 'NONE',
    };

    return NextResponse.json({ source: 'database', data });
  } catch (error: any) {
    console.error('[GET /api/store-settings]', error.message);
    return NextResponse.json({ source: 'fallback', data: inMemorySettings });
  }
}

/**
 * PUT /api/store-settings
 * Updates store configuration. Body: { name?, logoUrl?, address?, taxRate?, serviceChargeRate?, enableTax?, enableServiceCharge?, cashRoundingRule? }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ipAddress, userAgent } = extractReqMetadata(req);
    const oldSettings = { ...inMemorySettings };

    const {
      name,
      logoUrl,
      address,
      taxRate,
      serviceChargeRate,
      enableTax,
      enableServiceCharge,
      cashRoundingRule,
    } = body;

    // Always update in-memory state
    inMemorySettings = {
      ...inMemorySettings,
      ...(name !== undefined && { name: String(name) }),
      ...(logoUrl !== undefined && { logoUrl: String(logoUrl) }),
      ...(address !== undefined && { address: String(address) }),
      ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
      ...(serviceChargeRate !== undefined && { serviceChargeRate: Number(serviceChargeRate) }),
      ...(enableTax !== undefined && { enableTax: Boolean(enableTax) }),
      ...(enableServiceCharge !== undefined && { enableServiceCharge: Boolean(enableServiceCharge) }),
      ...(cashRoundingRule !== undefined && { cashRoundingRule: cashRoundingRule as CashRoundingRule }),
    };

    let data: StoreSettingsData = { ...inMemorySettings };

    if (isDbConfigured()) {
      const sql = getDb();

      // Ensure columns exist on store_settings table if needed
      try {
        await sql`
          ALTER TABLE store_settings
          ADD COLUMN IF NOT EXISTS service_charge_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
          ADD COLUMN IF NOT EXISTS enable_tax BOOLEAN NOT NULL DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS enable_service_charge BOOLEAN NOT NULL DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS cash_rounding_rule VARCHAR(20) NOT NULL DEFAULT 'NONE'
        `;
      } catch (_) {
        // Ignore if table doesn't support ALTER or already has columns
      }

      const rows = (await sql`
        UPDATE store_settings SET
          name                  = COALESCE(${name ?? null}, name),
          logo_url              = COALESCE(${logoUrl ?? null}, logo_url),
          address               = COALESCE(${address ?? null}, address),
          tax_rate              = COALESCE(${taxRate !== undefined ? Number(taxRate) : null}, tax_rate),
          service_charge_rate   = COALESCE(${serviceChargeRate !== undefined ? Number(serviceChargeRate) : null}, service_charge_rate),
          enable_tax            = COALESCE(${enableTax !== undefined ? Boolean(enableTax) : null}, enable_tax),
          enable_service_charge = COALESCE(${enableServiceCharge !== undefined ? Boolean(enableServiceCharge) : null}, enable_service_charge),
          cash_rounding_rule    = COALESCE(${cashRoundingRule ?? null}, cash_rounding_rule),
          updated_at            = NOW()
        WHERE id = 1
        RETURNING
          id,
          name,
          logo_url AS "logoUrl",
          address,
          tax_rate AS "taxRate",
          service_charge_rate AS "serviceChargeRate",
          enable_tax AS "enableTax",
          enable_service_charge AS "enableServiceCharge",
          cash_rounding_rule AS "cashRoundingRule"
      `) as any[];

      const row = rows[0] || inMemorySettings;
      data = {
        id: row.id ?? 1,
        name: row.name ?? inMemorySettings.name,
        logoUrl: row.logoUrl ?? inMemorySettings.logoUrl,
        address: row.address ?? inMemorySettings.address,
        taxRate: Number(row.taxRate ?? inMemorySettings.taxRate),
        serviceChargeRate: Number(row.serviceChargeRate ?? inMemorySettings.serviceChargeRate),
        enableTax: row.enableTax !== false && row.enableTax !== 'false',
        enableServiceCharge: row.enableServiceCharge !== false && row.enableServiceCharge !== 'false',
        cashRoundingRule: (row.cashRoundingRule as CashRoundingRule) || 'NONE',
      };
    }

    // Record audit log event for store settings mutation
    await createAuditLog({
      userId: 'usr-admin-cms',
      userName: 'Admin Owner',
      userRole: 'admin',
      actionType: 'STORE_SETTINGS_UPDATE',
      entityType: 'store_settings',
      entityId: 'settings-1',
      ipAddress,
      userAgent,
      description: `Memperbarui konfigurasi toko (Pajak: ${data.taxRate}%, Service Charge: ${data.serviceChargeRate}%, Rounding: ${data.cashRoundingRule})`,
      oldPayload: oldSettings,
      newPayload: data,
      status: 'SUCCESS',
    });

    return NextResponse.json({ source: isDbConfigured() ? 'database' : 'fallback', data });
  } catch (error: any) {
    console.error('[PUT /api/store-settings]', error.message);
    return NextResponse.json({ source: 'fallback', data: inMemorySettings });
  }
}

