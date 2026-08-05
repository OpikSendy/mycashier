# 🍽️ MyCashier — Online POS & Table Self-Ordering PWA System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.3-black?logo=bun)](https://bun.sh/)
[![TanStack React Query v5](https://img.shields.io/badge/React_Query-v5-FF4154?logo=react-query)](https://tanstack.com/query/latest)
[![Redis Cached](https://img.shields.io/badge/Redis-ioredis_Cached-DC382D?logo=redis)](https://redis.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Progressive_Web_App-10B981)](https://web.dev/progressive-web-apps/)

**MyCashier** adalah platform Aplikasi Kasir Online (Point of Sale / POS) dan Sistem Pemesanan Mandiri dari Meja (*Table QR Self-Ordering System*) terpadu berbasis Progressive Web Application (PWA) dengan perlindungan **RBAC (Role-Based Access Control)**, **TanStack React Query v5**, dan **Redis Caching Engine** sub-milidetik.

---

## 🌟 Fitur Utama (Core Features)

### 🛒 1. Table Self-Ordering View (Pelanggan - Route `/`)
* **Dedicated Mobile PWA Layout**: Antarmuka PWA mobile anti-zoom dengan touch-manipulation cepat tanpa delay.
* **Scan QR Meja**: Pelanggan memilih/scan nomor meja (`Meja 01` s/d `Meja 12`).
* **Kustomisasi & Cart Drawer**: Catatan khusus menu (*"Less Sugar"*, *"Ekstra Pedas"*) & kalkulasi otomatis total tagihan.

### 🖥️ 2. Cashier POS Station (Kasir - Route `/cashier`)
* **Protected by RBAC PIN (`1234`)**: Hanya petugas kasir berwenang yang dapat mengakses area kasir.
* **Billing Fast POS**: Transaksi kasir *walk-in*, antrean meja, kalkulator kembalian cash, QRIS/EDC payment, pemotongan stok otomatis, & simulasi **Cetak Struk Digital Kasir**.

### 📊 3. Admin CMS Master Control (Admin - Route `/admin`)
* **Protected by RBAC PIN (`8888`)**: Area rahasia manajer untuk mengelola master data resto.
* **Full Control Dashboard**: Master data produk CRUD, toggle stok inventory, & laporan omzet real-time.

### ⚡ 4. Enterprise Performance Stack (React Query v5 + Redis Cache)
* **TanStack React Query v5**: Stale-time 5 menit, background refetch, & zero unnecessary re-render.
* **Redis Caching Engine (`ioredis`)**: Caching sub-milidetik untuk katalog menu & statistik omzet (`/api/menu`).

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Core Framework**: Next.js 16 (App Router) + React 19 + TypeScript
* **Runtime & Package Manager**: Bun v1.3+
* **Data Fetching & Caching**: TanStack React Query v5 + Redis (`ioredis` with Memory Fallback)
* **Styling**: Tailwind CSS v4 (`@variant dark`), Touch Anti-Zoom Rules, & Glassmorphism UI
* **Security**: Role-Based Access Control (RBAC) + PIN Protection
* **AI Integration**: OpenRouter API (`google/gemini-2.5-flash`)

---

## 🚀 Panduan Memulai Lokal (Getting Started)

```bash
# Clone & install dependensi
git clone https://github.com/OpikSendy/mycashier.git
cd mycashier
bun install

# Jalankan server lokal
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda!

---

## 📝 Kredensial Hak Akses Demo

* 📱 **User Mobile PWA (`/`)**: Bebas diakses tanpa login.
* 🖥️ **Kasir POS (`/cashier`)**: PIN Demo `1234`
* 📊 **Admin CMS (`/admin`)**: PIN Demo `8888`
