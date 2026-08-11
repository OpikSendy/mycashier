# Database ERD & Schema Design — MyCashier

## PostgreSQL Relational Schema (Neon Serverless)

```mermaid
erDiagram
    store_settings {
        int id PK
        string name
        string logo_url
        string address
        numeric tax_rate
        timestamp updated_at
    }

    menus {
        string id PK
        string name
        string name_en
        string category
        string sub_category
        string variant_preset
        numeric price
        string description
        string description_en
        string image
        boolean is_available
        boolean is_popular
        timestamp created_at
    }

    orders {
        string id PK
        string table_number
        string customer_name
        numeric total_amount
        string status
        string payment_status
        string payment_method
        timestamp created_at
    }

    order_items {
        string id PK
        string order_id FK
        string product_id FK
        string product_name
        numeric price
        int quantity
        string notes
    }

    vouchers {
        string id PK
        string code
        string type
        numeric value
        numeric min_spend
        string description
        boolean is_active
    }

    inventory_items {
        string id PK
        string name
        numeric stock_quantity
        string unit
        numeric min_threshold
    }

    orders ||--|{ order_items : "contains"
    menus ||--o{ order_items : "referenced in"
```

---

## Table Definitions DDL SQL

Lokasi SQL DDL lengkap tersimpan pada [`src/lib/schema.sql`](file:///c:/Capstone/mycashier/src/lib/schema.sql).
