# 🍽️ MyCashier — Online POS & Table Self-Ordering PWA System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.3-black?logo=bun)](https://bun.sh/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Progressive_Web_App-10B981)](https://web.dev/progressive-web-apps/)
[![OpenRouter AI](https://img.shields.io/badge/AI-OpenRouter_API-FF6B35)](https://openrouter.ai/)
[![Scalar API Specs](https://img.shields.io/badge/API_Docs-Scalar-615EFF?logo=scalar)](https://mycashier-five.vercel.app/docs)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://mycashier-five.vercel.app)

**MyCashier** adalah platform Aplikasi Kasir Online (Point of Sale / POS) dan Sistem Pemesanan Mandiri dari Meja (*Table QR Self-Ordering System*) terpadu berbasis Progressive Web Application (PWA) dengan perlindungan **RBAC (Role-Based Access Control)** dan integrasi data real-time antar seluruh modul: PWA Pelanggan, Kasir POS, Dapur KDS, dan Admin CMS.

🔗 **Live Demo**: [mycashier-five.vercel.app](https://mycashier-five.vercel.app)  
📖 **Interactive Scalar API Docs**: [mycashier-five.vercel.app/docs](https://mycashier-five.vercel.app/docs)  

---

## 🌟 Fitur Utama (Core Features)

### 📱 1. Table Self-Ordering PWA (Pelanggan — Route `/`)
- **Dedicated Mobile PWA Layout**: Antarmuka Clean Soft Minimalist mobile dengan touch-native scroll, anti-zoom rules, dan micro-animations halus.
- **Scan QR Code Meja**: Pelanggan scan QR standee fisik meja (`/?table=Meja%2004`) — nomor meja otomatis **terkunci paten** dan tidak bisa diubah.
- **Bilingual Support (ID/EN)**: Seluruh UI, nama menu, dan deskripsi tersedia dalam Bahasa Indonesia & English. Toggle bahasa kapan saja.
- **Sub-Kategori Menu Dinamis**: Filter cepat menu berdasarkan Sub-Kategori (*Coffee*, *Non-Coffee*, *Rice Bowl & Nasi*, *Pastry & Bakery*, *Cakes & Sweets*, *Tea & Sparkle*, *Finger Food*).
- **Interactive Item Customization Modal**: Chip opsi 1-klik untuk Sugar Level, Ice Level, Spiciness, Egg Style, Sauce sesuai kategori produk.
- **Pelacakan Status Pesanan Live**: Pelanggan memantau status pesanan meja secara real-time (`PENDING` → `COOKING` → `READY` → `SERVED`).
- **AI Waiter Chatbot**: Tombol chat dengan AI persona *"Kak Maya"* (waiter virtual berbasis OpenRouter) yang menjawab pertanyaan seputar menu, cara pembuatan, penyajian, dan rekomendasi dengan gaya storytelling natural.

### 🖥️ 2. Kasir POS Station (Kasir — Route `/cashier`)
- **Protected by RBAC PIN (`1234`)**: Hanya petugas kasir berwenang yang dapat mengakses.
- **Fast POS Menu Grid**: Grid produk kasir dengan filter Kategori Utama & Sub-Kategori, search cepat, serta thumbnail gambar produk.
- **Walk-in Transaction Cart**: Tambah item kasir cepat (walk-in), kalkulasi subtotal + pajak 10%, bayar Cash, QRIS, atau EDC.
- **Antrean Tagihan Meja**: Feed real-time tagihan meja pelanggan yang belum lunas, tombol Proses Pembayaran sekali klik.
- **Payment Modal & Struk Digital**: Pilihan metode pembayaran (Cash/QRIS/EDC), kalkulator kembalian Cash, dan simulator cetak struk digital kasir.

### 🍳 3. Dapur KDS Display (Dapur — Route `/kitchen`)
- **Protected by RBAC PIN (`1234`)**: Dapat diakses oleh Kasir & Admin.
- **Kanban Board Tiket Pesanan**: 4 kolom status tiket masak real-time: `PENDING` → `COOKING` → `READY` → `SERVED`.
- **Detail Tiket Lengkap**: Setiap tiket menampilkan nomor meja, nama pelanggan, daftar item + catatan varian (`Less Sugar, Less Ice`), dan waktu pesanan masuk.
- **Aksi Status 1-Klik**: Tombol *Mulai Masak*, *Siap Disajikan*, *Selesai* langsung meng-update status pesanan secara live di seluruh modul.

### 📊 4. Admin CMS Master Control (Admin — Route `/admin`)
- **Protected by RBAC PIN (`8888`)**: Area eksklusif manager/admin.
- **Dashboard Omzet Real-Time**: Ringkasan Total Omzet Lunas, jumlah transaksi lunas, dan menu terlaris resto.
- **Master Menu CRUD**: Tambah/hapus/toggle stok menu lengkap dengan nama Indonesia & Inggris, Sub-Kategori, Preset Modifiers/Varian, harga, deskripsi, dan gambar.
- **Quick Sub-Kategori Chips**: Chip preset *Coffee, Rice Bowl, Pastry, dst.* agar admin bisa input sub-kategori dengan cepat.
- **QR Code Standee Generator**: Generator dan pencetak QR Code fisik untuk Meja 01 s/d Meja 12 — scan oleh pelanggan langsung mengarah ke `/?table=Meja%20XX` dengan nomor meja terkunci.
- **Log Transaksi Master**: Rekap seluruh riwayat transaksi meja & walk-in kasir.

---

## 🔄 Alur Pengguna End-to-End (Seamless User Flow)

```
Pelanggan Scan QR Meja
     ↓
PWA Pelanggan (/) — Pilih Sub-Kategori & Opsi Varian → Kirim Pesanan (UNPAID/PENDING)
     ↓
Kasir POS (/cashier) — Terima Tagihan Meja → Proses Bayar (PAID) → Cetak Struk
     ↓
Dapur KDS (/kitchen) — Tiket Masuk → COOKING → READY → SERVED (update real-time ke PWA)
     ↓
Admin CMS (/admin) — Omzet & Log Transaksi Ter-update Otomatis
```

---

## 🛠️ Teknologi (Tech Stack)

| Layer | Teknologi |
|---|---|
| **Core Framework** | Next.js 16.3.0 (App Router) + React 19 + TypeScript |
| **Runtime & Package Manager** | Bun v1.3+ |
| **Styling** | Tailwind CSS v4 (`@variant dark`), Clean Soft Minimalist Design System |
| **Icons** | Lucide React |
| **State Management** | React Context API (`AppContext`) — shared real-time state antar 4 modul |
| **AI Integration** | OpenRouter API (`google/gemini-2.5-flash`) — Human Waiter Storytelling Persona |
| **PWA** | `next-pwa`, Web App Manifest, Install Prompt |
| **Security** | RBAC PIN Protection (Customer / Cashier / Admin) |
| **Deployment** | Vercel (Auto-deploy dari GitHub `main`) |

---

## 🚀 Panduan Memulai Lokal (Getting Started)

```bash
# Clone & install dependensi
git clone https://github.com/OpikSendy/mycashier.git
cd mycashier
bun install

# (Opsional) Tambahkan variabel environment untuk AI Chatbot
cp .env.example .env.local
# Isi OPENROUTER_API_KEY dengan API Key OpenRouter kamu

# Jalankan server lokal
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser!

---

## 📝 Kredensial Hak Akses Demo

| Role | Route | PIN Demo |
|---|---|---|
| 📱 Pelanggan | `/` | Bebas (tidak perlu login) |
| 🖥️ Kasir POS | `/cashier` | `1234` |
| 🍳 Dapur KDS | `/kitchen` | `1234` |
| 📊 Admin CMS | `/admin` | `8888` |

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── page.tsx              # PWA Pelanggan (/)
│   ├── cashier/page.tsx      # Kasir POS (/cashier)
│   ├── kitchen/page.tsx      # Dapur KDS (/kitchen)
│   ├── admin/page.tsx        # Admin CMS (/admin)
│   └── api/
│       ├── chat/route.ts     # AI Chatbot (OpenRouter)
│       └── menu/route.ts     # API Data Menu
├── context/
│   └── AppContext.tsx         # Shared real-time state (orders, cart, menu, auth)
├── data/
│   ├── initialData.ts        # Master data menu & pesanan awal (+ subCategory)
│   └── translations.ts       # Kamus bilingual ID/EN
├── features/
│   ├── user-pwa/             # UserPwaApp.tsx — Halaman Pelanggan
│   ├── cashier-pos/          # CashierPosApp.tsx — Halaman Kasir POS
│   ├── kitchen/              # KitchenView.tsx — Dapur KDS
│   ├── admin-cms/            # AdminCmsApp.tsx — Admin CMS
│   └── ai-assistant/         # AiChatWidget.tsx — AI Chatbot Widget
└── components/
    ├── auth/AuthGuardModal    # RBAC PIN Protection Modal
    ├── common/TablePickerSelect # Custom React dropdown meja
    └── pwa/PwaInstallButton   # PWA Install Prompt Button
```

---

## 🤖 AI Waiter Chatbot

MyCashier dilengkapi AI Chatbot dengan persona **"Kak Maya"** — seorang pelayan virtual yang menjawab pertanyaan pelanggan seputar menu dalam gaya bercerita natural (bukan bullet point robot). Contoh pertanyaan:

- *"Kak, gimana cara bikin Kopi Susu Aren Premium?"*
- *"Rekomendasiin minuman yang enak buat cuaca panas dong Kak!"*
- *"Biscoff Cheesecake-nya manis banget nggak Kak?"*

---

## 📄 Lisensi

MIT License © 2025 [OpikSendy](https://github.com/OpikSendy)
