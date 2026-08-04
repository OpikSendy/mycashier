# Technical Requirement Document (TRD) — MyCashier

## 1. Technology Stack Architecture
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Runtime & Package Manager**: Bun v1.3+
- **Styling & Design System**: TailwindCSS v4 with `@variant dark`, Custom Glassmorphism, & Modern Micro-animations
- **Icons & Animation**: `lucide-react` & `framer-motion`
- **State Management**: React State + Context API (`AppContext` for Theme, Language, Active View, Cart, Orders)
- **PWA Capabilities**: Service Worker & Web App Manifest (`manifest.json`)
- **AI Integration**: OpenRouter API (`google/gemini-2.5-flash` fallback endpoint)

## 2. Directory & Component Structure
```text
C:\Capstone\mycashier
├── docs/
│   ├── 01_PRD.md
│   ├── 02_TRD.md
│   ├── 03_DATABASE_ERD.md
│   ├── 04_API_SPEC.md
│   └── 05_ROADMAP_TASKS.md
├── public/
│   ├── icon.jpg
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts
│   │   │   └── orders/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── data/
│   │   ├── initialData.ts
│   │   └── translations.ts
│   └── features/
│       ├── ai-assistant/
│       ├── cashier/
│       ├── customer/
│       ├── kitchen/
│       ├── manager/
│       └── navbar/
```
