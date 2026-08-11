# Implementation Roadmap & Task Progress — MyCashier

## Phase 1: Architecture & Foundation Setup
- [x] Create Next.js 16 app with Bun runtime & TypeScript
- [x] Install `lucide-react`, `recharts`, `@neondatabase/serverless`
- [x] Generate comprehensive documentation (`docs/01_PRD.md` to `docs/05_ROADMAP_TASKS.md`)
- [x] Setup global styling & Tailwind v4 dark/light mode system in `src/app/globals.css`

## Phase 2: Core Data & Persistence Layer (Sprint A)
- [x] Create `src/lib/db.ts` Neon PostgreSQL serverless client singleton with fallback detector
- [x] Create `src/lib/schema.sql` (SQL DDL) & `src/lib/seed.ts` (Initial Data Population)
- [x] Implement global state provider `src/context/AppContext.tsx` with optimistic API sync

## Phase 3: Interactive View Modules & UX Polish (Sprint B & C)
- [x] **Customer Table Self-Ordering PWA**: Table picker lock, catalog grid, Skeleton Loading, Cart Drawer, AI Smart Upselling.
- [x] **Cashier POS Station Station**: Table queue feed, split-bill calculator, payment modal, 58mm Thermal Receipt simulator.
- [x] **Kitchen Display System (KDS)**: Real-time ticket status, live stopwatch timer (`MM:SS`), color threshold badges, Web Audio chime.
- [x] **Manager CMS & Analytics**: Recharts omzet 7-hari, raw material inventory manager, visual floor map editor, CSV exporter.
- [x] **Ask MyCashier AI Assistant**: OpenRouter AI assistant widget & Executive AI Daily Sales Briefing generator.

## Phase 4: Production PWA, Web Push & Multi-Branch (Sprint D, E, F)
- [x] Production Service Worker (`public/sw.js`) with Stale-While-Revalidate & Network-First strategies.
- [x] HTML5 Web Push Notification hook & permission request modal.
- [x] Multi-Branch Resto Selector (Cabang Jakarta Pusat, Bandung Dago, Bali Seminyak).
- [x] Production build verification (`bun run build`) with 0 errors.
