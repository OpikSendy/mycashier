-- =============================================
-- MyCashier — PostgreSQL Schema (Neon)
-- Run this SQL in your Neon SQL Editor
-- =============================================

-- 1. Store Settings (single-row config table)
CREATE TABLE IF NOT EXISTS store_settings (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100)   NOT NULL DEFAULT 'MyCashier Resto',
  logo_url              TEXT           DEFAULT '/icon.jpg',
  address               TEXT           DEFAULT 'Jl. Raya No. 1, Jakarta',
  tax_rate              NUMERIC(5, 2)  NOT NULL DEFAULT 10.00,
  service_charge_rate   NUMERIC(5, 2)  NOT NULL DEFAULT 5.00,
  enable_tax            BOOLEAN        NOT NULL DEFAULT TRUE,
  enable_service_charge BOOLEAN        NOT NULL DEFAULT TRUE,
  cash_rounding_rule    VARCHAR(20)    NOT NULL DEFAULT 'NONE',
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Seed default store settings (only if empty)
INSERT INTO store_settings (name, logo_url, address, tax_rate, service_charge_rate, enable_tax, enable_service_charge, cash_rounding_rule)
SELECT 'MyCashier Resto', '/icon.jpg', 'Jl. Raya No. 1, Jakarta', 10.00, 5.00, TRUE, TRUE, 'NONE'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- 2. Menu Items
CREATE TABLE IF NOT EXISTS menus (
  id              VARCHAR(50)   PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  name_en         VARCHAR(200),
  category        VARCHAR(20)   NOT NULL CHECK (category IN ('food', 'drinks', 'snack', 'dessert')),
  sub_category    VARCHAR(100),
  variant_preset  VARCHAR(20)   DEFAULT 'none' CHECK (variant_preset IN ('drinks', 'food', 'snack', 'dessert', 'none')),
  price           INTEGER       NOT NULL CHECK (price > 0),
  description     TEXT          NOT NULL DEFAULT '',
  description_en  TEXT,
  image           TEXT          NOT NULL DEFAULT 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  is_popular      BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. Orders
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(20)   PRIMARY KEY,
  table_number    VARCHAR(50)   NOT NULL,
  customer_name   VARCHAR(100)  NOT NULL DEFAULT 'Pengunjung',
  total_amount    INTEGER       NOT NULL DEFAULT 0,
  status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'COOKING', 'READY', 'SERVED', 'COMPLETED')),
  payment_status  VARCHAR(10)   NOT NULL DEFAULT 'UNPAID'
                  CHECK (payment_status IN ('UNPAID', 'PAID')),
  payment_method  VARCHAR(10)   NOT NULL DEFAULT 'CASH'
                  CHECK (payment_method IN ('CASH', 'QRIS', 'DEBIT')),
  created_at      VARCHAR(20)   NOT NULL -- stored as time string HH:MM:SS for UI compatibility
);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id            VARCHAR(60)   PRIMARY KEY,
  order_id      VARCHAR(20)   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    VARCHAR(50)   NOT NULL,
  product_name  VARCHAR(200)  NOT NULL,
  price         INTEGER       NOT NULL,
  quantity      INTEGER       NOT NULL DEFAULT 1,
  notes         TEXT          DEFAULT ''
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category);
CREATE INDEX IF NOT EXISTS idx_menus_is_available ON menus(is_available);

-- =============================================================================
-- MyCashier Enterprise Schema — Multi-Branch, Inventory Transfers & Ledger
-- =============================================================================

-- 5. Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id          VARCHAR(50)   PRIMARY KEY,
  code        VARCHAR(20)   UNIQUE NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  city        VARCHAR(50)   NOT NULL,
  address     TEXT          NOT NULL,
  phone       VARCHAR(30),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Seed Default Branches (Jakarta, Bandung, Bali)
INSERT INTO branches (id, code, name, city, address, phone) VALUES
  ('branch-jkt', 'JKT-01', 'Cabang Jakarta Pusat', 'Jakarta', 'Grand Indonesia Mall, Lt. 3', '021-23580001'),
  ('branch-bdg', 'BDG-01', 'Cabang Bandung Dago', 'Bandung', 'Jl. Ir. H. Juanda No. 88, Dago', '022-4200002'),
  ('branch-bali', 'DPS-01', 'Cabang Bali Seminyak', 'Bali', 'Jl. Kayu Aya No. 12, Seminyak', '0361-730003'),
  ('b-1', 'JKT-ALT', 'Cabang Jakarta Pusat (Alt)', 'Jakarta', 'Grand Indonesia Mall, Lt. 3', '021-23580001'),
  ('b-2', 'BDG-ALT', 'Cabang Bandung Dago (Alt)', 'Bandung', 'Jl. Ir. H. Juanda No. 88, Dago', '022-4200002'),
  ('b-3', 'DPS-ALT', 'Cabang Bali Seminyak (Alt)', 'Bali', 'Jl. Kayu Aya No. 12, Seminyak', '0361-730003')
ON CONFLICT (id) DO NOTHING;

-- 6. Inventory Items Master Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id             VARCHAR(50)   PRIMARY KEY,
  name           VARCHAR(150)  NOT NULL,
  name_en        VARCHAR(150),
  category       VARCHAR(50)   NOT NULL CHECK (category IN ('raw_material', 'packaging', 'beverage_base')),
  unit           VARCHAR(20)   NOT NULL CHECK (unit IN ('kg', 'liter', 'pack', 'pcs', 'gram')),
  min_threshold  NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  cost_per_unit  INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 7. Branch Inventory Stocks Table
CREATE TABLE IF NOT EXISTS branch_stocks (
  id              VARCHAR(100)  PRIMARY KEY, -- composite key: branch_id + ':' + item_id
  branch_id       VARCHAR(50)   NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  item_id         VARCHAR(50)   NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_threshold   NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  last_restocked  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_branch_item UNIQUE (branch_id, item_id)
);

-- 8. Inter-Branch Inventory Transfers Table
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id                VARCHAR(50)   PRIMARY KEY,
  transfer_number   VARCHAR(50)   UNIQUE NOT NULL,
  source_branch_id  VARCHAR(50)   NOT NULL REFERENCES branches(id),
  dest_branch_id    VARCHAR(50)   NOT NULL REFERENCES branches(id),
  status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  requested_by      VARCHAR(100)  NOT NULL,
  approved_by       VARCHAR(100),
  notes             TEXT,
  requested_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  approved_at       TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT check_different_branches CHECK (source_branch_id <> dest_branch_id)
);

-- 9. Inventory Transfer Items Table
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
  id                    VARCHAR(60)   PRIMARY KEY,
  transfer_id           VARCHAR(50)   NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
  item_id               VARCHAR(50)   NOT NULL REFERENCES inventory_items(id),
  quantity_requested    NUMERIC(10,2) NOT NULL CHECK (quantity_requested > 0),
  quantity_transferred  NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit                  VARCHAR(20)   NOT NULL
);

-- 10. Stock Mutation History / Ledger Table
CREATE TABLE IF NOT EXISTS stock_mutations (
  id              VARCHAR(60)   PRIMARY KEY,
  branch_id       VARCHAR(50)   NOT NULL REFERENCES branches(id),
  item_id         VARCHAR(50)   NOT NULL REFERENCES inventory_items(id),
  mutation_type   VARCHAR(30)   NOT NULL
                  CHECK (mutation_type IN ('MANUAL_OVERRIDE', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE_DEDUCTION', 'RESTOCK', 'WASTE_ADJUSTMENT')),
  quantity_change NUMERIC(10,2) NOT NULL,
  stock_before    NUMERIC(10,2) NOT NULL,
  stock_after     NUMERIC(10,2) NOT NULL,
  reference_id    VARCHAR(50),  -- e.g. transfer_id or order_id
  notes           TEXT,
  created_by      VARCHAR(100)  NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 11. Security Audit Trail Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id             VARCHAR(60)   PRIMARY KEY,
  user_id        VARCHAR(100)  NOT NULL,
  user_name      VARCHAR(100),
  role           VARCHAR(30)   NOT NULL,
  action         VARCHAR(100)  NOT NULL,
  resource_type  VARCHAR(50)   NOT NULL,
  resource_id    VARCHAR(50),
  ip_address     VARCHAR(50),
  user_agent     TEXT,
  old_values     JSONB,
  new_values     JSONB,
  payload_diff   JSONB,
  status         VARCHAR(20)   NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Performance Indexes for Enterprise Features
CREATE INDEX IF NOT EXISTS idx_branch_stocks_branch ON branch_stocks(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_stocks_item ON branch_stocks(item_id);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON inventory_transfers(source_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_dest ON inventory_transfers(dest_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON inventory_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_branch ON stock_mutations(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_item ON stock_mutations(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_created ON stock_mutations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

