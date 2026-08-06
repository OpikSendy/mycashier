-- =============================================
-- MyCashier — PostgreSQL Schema (Neon)
-- Run this SQL in your Neon SQL Editor
-- =============================================

-- 1. Store Settings (single-row config table)
CREATE TABLE IF NOT EXISTS store_settings (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL DEFAULT 'MyCashier Resto',
  logo_url    TEXT           DEFAULT '/icon.jpg',
  address     TEXT           DEFAULT 'Jl. Raya No. 1, Jakarta',
  tax_rate    NUMERIC(5, 2)  NOT NULL DEFAULT 10.00,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Seed default store settings (only if empty)
INSERT INTO store_settings (name, logo_url, address, tax_rate)
SELECT 'MyCashier Resto', '/icon.jpg', 'Jl. Raya No. 1, Jakarta', 10.00
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
