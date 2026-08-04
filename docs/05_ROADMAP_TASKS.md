# Implementation Roadmap & Task Breakdown — MyCashier

## Phase 1: Architecture & Foundation Setup
- [x] Create Next.js 16 app with Bun runtime & TypeScript
- [x] Install `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`
- [x] Generate comprehensive documentation (`docs/01_PRD.md` to `docs/05_ROADMAP_TASKS.md`)
- [x] Setup global styling & Tailwind v4 dark/light mode system in `src/app/globals.css`

## Phase 2: Core Data & State Management
- [x] Build initial F&B menu dataset, tables list, and sample orders in `src/data/initialData.ts`
- [x] Build bilingual ID/EN dictionary in `src/data/translations.ts`
- [x] Implement global state provider `src/context/AppContext.tsx` (View switcher, theme, language, active cart, live order queue)

## Phase 3: Interactive View Modules
- [x] **Customer Table Self-Ordering View**: Table picker, menu grid, customization notes modal, cart drawer, checkout modal.
- [x] **Cashier POS Station**: Walk-in & Table queue management, quick add items, payment modal (Cash/QRIS/Debit), receipt preview & print simulator.
- [x] **Kitchen Display System (KDS)**: Real-time ticket status workflow (`Pending` -> `Cooking` -> `Ready` -> `Served`).
- [x] **Manager CMS & Analytics**: Sales chart, menu CRUD modal, stock toggle, revenue summary.
- [x] **Ask MyCashier AI Assistant**: OpenRouter AI assistant widget for real-time sales advice.

## Phase 4: Verification & Git Remote Sync
- [x] Production build verification (`bun run build`)
- [x] Git initialization & atomic commit push to GitHub.
