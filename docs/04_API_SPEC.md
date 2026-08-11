# REST API Specification — MyCashier

Seluruh API route berjalan di Next.js 16 App Router (`src/app/api/`) dengan type safety penuh dan dukungan PostgreSQL / Fallback in-memory.

---

## 📋 API Endpoints Index (17 Endpoints)

| Endpoint | Method | Description |
|---|---|---|
| `/api/menu` | `GET`, `POST` | Fetch all menu items & create new menu item |
| `/api/menu/[id]` | `PUT`, `PATCH`, `DELETE` | Update full item, toggle availability, or delete item |
| `/api/orders` | `GET`, `POST` | Fetch all orders with batch items & create new order |
| `/api/orders/[id]` | `PATCH` | Update kitchen status (`PENDING`/`COOKING`/`READY`/`SERVED`) & mark paid |
| `/api/orders/stream` | `GET` | Server-Sent Events (SSE) live order stream |
| `/api/store-settings` | `GET`, `PUT` | Read & Update store configuration (Name, Tax %, Logo, Address) |
| `/api/analytics` | `GET` | 7-day revenue trend, payment distribution, & top products |
| `/api/recommendations` | `GET` | AI contextual menu recommendations based on active cart |
| `/api/vouchers` | `GET`, `POST` | Fetch active vouchers & validate promo discount codes |
| `/api/inventory` | `GET`, `POST`, `PUT` | Raw material stock tracking & low-stock alerts |
| `/api/ai/briefing` | `GET` | Executive AI Daily Sales Briefing in Markdown format |
| `/api/chat` | `POST` | Ask MyCashier AI chat assistant via OpenRouter API |
