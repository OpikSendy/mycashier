# Technical Requirement Document (TRD) — MyCashier Architecture

## 1. System Architecture Overview
MyCashier menggunakan arsitektur Modern Next.js 16 App Router dengan Single Page Application (SPA) view switcher untuk navigasi mulus zero-lag antara mode Customer PWA, Cashier POS, Kitchen KDS, dan Admin CMS.

```
[ Customer PWA ]     [ Cashier POS ]     [ Kitchen KDS ]     [ Admin CMS ]
        │                   │                   │                  │
        └───────────────────┴─────────┬─────────┴──────────────────┘
                                      │
                         [ AppContext State Layer ]
                                      │
                      ┌───────────────┴───────────────┐
                      │    REST API & SSE Stream      │
                      └───────────────┬───────────────┘
                                      │
                         [ Neon PostgreSQL DB ]
```

---

## 2. Technology Stack Specifications
- **Runtime & Package Manager**: Bun v1.3+
- **Frontend Framework**: Next.js 16.3 (App Router, Turbopack), React 19, TypeScript 5.x
- **Styling**: Tailwind CSS v4 dengan `@variant dark`, custom glassmorphism, & micro-animations
- **Iconography**: `lucide-react`
- **Data Visualizations**: `recharts` 3.x
- **Database Client**: `@neondatabase/serverless` (Neon PostgreSQL)
- **Real-Time Engine**: Server-Sent Events (SSE) via `ReadableStream` (`/api/orders/stream`)
- **PWA Service Worker**: Custom `public/sw.js` (Network-First for API, Stale-While-Revalidate for images, Cache-First for static assets)

---

## 3. State & Persistence Flow
- **AppContext**: Menyimpan state aktif (`menu`, `orders`, `cart`, `storeSettings`, `vouchers`, `inventory`, `tableFloorMap`).
- **Optimistic UI Updates**: Perubahan pada UI dieksekusi secara instan, disinkronkan secara asinkron ke API/PostgreSQL.
- **Graceful Fallback Mode**: Jika `DATABASE_URL` belum dikonfigurasi di `.env.local`, aplikasi secara otomatis beralih ke mode in-memory tanpa melempar runtime error.
