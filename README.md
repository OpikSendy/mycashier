# 🍽️ MyCashier — Online POS & Table Self-Ordering PWA System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.3-black?logo=bun)](https://bun.sh/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Progressive_Web_App-10B981)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**MyCashier** adalah platform Aplikasi Kasir Online (Point of Sale / POS) dan Sistem Pemesanan Mandiri dari Meja (*Table QR Self-Ordering System*) terpadu berbasis Progressive Web Application (PWA). Platform ini dirancang untuk industri F&B (Restoran, Kafe, Kopi Shop, & Warung Modern) guna mempercepat alur transaksi, mengurangi antrean, serta memberikan analitik omzet berbasis AI secara real-time.

---

## 🌟 Fitur Utama (Core Features)

### 🛒 1. Table Self-Ordering View (Pelanggan)
* **Pilihan Nomor Meja Interaktif**: Pelanggan memilih/scan nomor meja (`Meja 01` s/d `Meja 12`).
* **Filter Kategori & Pencarian Real-time**: Filter menu (*Makanan Utama, Minuman, Dessert, Snack*) dan pencarian instan.
* **Modal Kustomisasi Catatan**: Tambahkan catatan khusus per menu (contoh: *"Less Sugar"*, *"Ekstra Pedas"*).
* **Floating Cart Drawer**: Keranjang belanja interaktif dengan kalkulasi otomatis Subtotal, Pajak Resto (10%), dan Total Tagihan.

### 🖥️ 2. Cashier POS Station (Kasir)
* **Antrean Transaksi Meja**: Melihat dan memproses pesanan meja yang masuk secara langsung.
* **POS Kasir Cepat**: Input pesanan langsung untuk pelanggan *walk-in*.
* **Multi Payment Processing**: Pembayaran Tunai (dengan kalkulator kembalian), QRIS Digital, & EDC Debit.
* **Simulasi Cetak Struk Digital**: Tampilan cetak struk kasir (*thermal printer style*) siap cetak.

### 🍳 3. Kitchen Display System / KDS Board (Dapur)
* **Papan Kanban Tiket Masakan**: 4 kolom status tiket (`Menunggu` -> `Dimasak` -> `Siap Diantar` -> `Selesai`).
* **Update Status 1-Klik**: Memudahkan koki dan barista mengelola antrean tanpa kertas.

### 📊 4. Manager CMS & Sales Analytics (Manajer Resto)
* **Dashboard Omzet & Statistik**: Grafik omzet harian, total transaksi, dan menu terlaris.
* **Manajemen Stok & Menu**: Tambah menu baru & ubah status stok (*Tersedia / Stok Habis*) secara instan.

### 🤖 5. Ask MyCashier AI Assistant
* **Asisten AI Cerdas**: Didukung oleh OpenRouter API untuk konsultasi strategi penjualan, promosi menu, dan analisis omzet restoran.

### 🌓 6. Universal Dark/Light Mode & Bilingual (ID/EN)
* Didukung **Native View Transitions API** untuk pergeseran tampilan dan pergantian tema yang super mulus.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Core Framework**: Next.js 16 (App Router) + React 19 + TypeScript
* **Runtime & Package Manager**: Bun v1.3+
* **Styling**: Tailwind CSS v4 (`@variant dark`), Custom Glassmorphism, & Modern Micro-animations
* **Icons & Animation**: `lucide-react` & `framer-motion`
* **State Management**: React State + Context API (`AppContext` with View Transitions API)
* **AI Integration**: OpenRouter API (`google/gemini-2.5-flash`)
* **PWA**: Web App Manifest & Service Worker

---

## 🚀 Panduan Memulai Lokal (Getting Started)

### 1. Prasyarat
Pastikan Anda telah menginstall **Bun** (atau Node.js v20+).

```bash
# Cek versi Bun
bun --version
```

### 2. Kloning Repository & Install Dependensi
```bash
git clone https://github.com/OpikSendy/mycashier.git
cd mycashier

# Install dependensi menggunakan Bun
bun install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di direktori utama:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Jalankan Server Pengembang
```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat aplikasi MyCashier!

---

## 📦 Verifikasi Production Build

```bash
bun run build
```

---

## 📝 Lisensi

Dikembangkan oleh **Isyandi Muhammad Fadillah (Sendy)**. Berlisensi di bawah [MIT License](LICENSE).
