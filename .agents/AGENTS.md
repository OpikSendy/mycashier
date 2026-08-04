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
