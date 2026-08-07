# MyCashier Agent Guidelines & Architecture Rules

## Project Standards
- **App Name**: MyCashier (Online POS & Table Self-Ordering PWA)
- **Framework**: Next.js 16 (App Router), Bun, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with `@variant dark`, Custom Glassmorphism, Modern Micro-animations
- **Icons**: `lucide-react`
- **State Management**: `AppContext` for active view, theme, language, active cart, and live order feed
- **Routing**: Single Page Application (SPA) view switcher (`customer`, `cashier`, `kitchen`, `manager`) for ultra-fast, zero-lag experience.

## AI Assistant Persona
- "Ask MyCashier AI" connected to `/api/chat` (OpenRouter API) to provide sales insights and store management advice.

## Software Engineering Workflow & Role Standards

### 1. Multi-Role Engineering Mindset
When planning and executing tasks, adopt distinct software engineering perspectives:
- **Tech Lead / Architect**: High-level design, API contracts, database schemas, and granular task breakdown before coding. Present the architectural plan first.
- **Backend Engineer**: Build type-safe API routes, database queries, validation, and performance caching.
- **Frontend Engineer**: Craft pixel-perfect UI/UX, responsive components, micro-animations, and dynamic state bindings.
- **QA / DevOps**: Verify builds (`bun run build`), enforce zero TS errors, write atomic commits, and validate end-to-end integration.

### 2. Granular & Modular Execution
- **Modular Sub-Tasks**: Divide features into small, independent sub-tasks (e.g. 1.1 BE API, 1.2 FE Component, 1.3 Integration, 1.4 QA Check).
- **Incremental Verification**: Execute and verify sub-tasks step-by-step with clear checkpoints rather than doing one giant monolithic execution.
- **Role Checkpoints**: Highlight which role perspective is being executed during each modular step.

