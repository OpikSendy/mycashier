# Product Requirement Document (PRD) — MyCashier POS & Table Self-Ordering PWA

## 1. Executive Summary
**MyCashier** adalah platform Aplikasi Kasir Online (Point of Sale / POS) dan Sistem Pemesanan Mandiri dari Meja (Table QR Self-Ordering System) berbasis Progressive Web Application (PWA) terpadu. Platform ini dirancang untuk usaha F&B (Restoran, Kafe, Kopi Shop, & Warung Modern) guna mempercepat alur pemesanan, menghilangkan antrean kasir, serta memberikan analitik penjualan berbasis AI secara real-time.

---

## 2. Target Users & User Roles
1. **Pelanggan (Customer / Table Guest)**: Scan QR Meja / Pilih Meja ➔ Lihat Katalog Menu ➔ AI Smart Upselling ➔ Input Kupon Diskon Promo ➔ Submit Pesanan Meja.
2. **Kasir (Cashier POS Operator)**: Kelola antrean tagihan meja, input pesanan kasir cepat (*walk-in*), kalkulator *Split-Bill*, proses pembayaran (Tunai, QRIS, Debit), cetak struk thermal 58mm/80mm, & notifikasi web push.
3. **Dapur (Kitchen Display System / KDS Operator)**: Papan tiket antrean dapur real-time dengan live stopwatch timer (`MM:SS`), indikator warna ambang batas (Hijau, Kuning, Merah Pulse), & chime notifikasi suara Web Audio API.
4. **Manajer / Pemilik Resto (Admin CMS & AI Briefing)**: Manajemen master menu & harga (*CRUD*), denah tata letak meja interaktif (*Visual Floor Map*), manajemen stok bahan baku (*Inventory*), generator kupon promo, analitik grafik Recharts, & laporan eksekutif harian bertenaga AI (**Executive AI Sales Briefing**).

---

## 3. Core Features & Functional Requirements

### 3.1 Customer Self-Ordering PWA
- **Table Lock & QR Scan**: Kunci meja otomatis via URL param (`?table=Meja%2004`).
- **AI Smart Upselling**: Rekomendasi otomatis "Sering Dibeli Bersama" di keranjang berbasis matriks kompatibilitas produk.
- **Dynamic Promo Vouchers**: Input kode kupon promo (`WELCOME10`, `HEMAT20`, `MYCASHIER50`) dengan validasi real-time & rincian diskon.
- **PWA Offline Resilience**: Service Worker (`sw.js`) dengan strategi Stale-While-Revalidate untuk gambar menu & Cache-First untuk app shell.

### 3.2 Cashier POS Station
- **Interactive Split-Bill Calculator**: Opsi bayar pisah tagihan meja (Bagi rata per orang vs Bayar per item pilihan).
- **Thermal Receipt Simulator**: Modal cetak struk thermal 58mm/80mm lengkap dengan barcode QRIS, rincian pajak, diskon promo, & CSS `@media print`.
- **Browser Web Push Notifications**: Notifikasi browser otomatis saat ada pesanan meja baru masuk.

### 3.3 Kitchen Display System (KDS)
- **Live Stopwatch Timer (`MM:SS`)**: Penghitung waktu mundur/maju tiket dapur per detik.
- **Dynamic Color Badges**: `< 10m` Hijau ➔ `10-20m` Kuning ➔ `> 20m` Red Pulse.
- **Web Audio Chime Alert**: Notifikasi suara nada ganda (D5 ➔ A5) tanpa file MP3 eksternal.

### 3.4 Admin CMS & Executive AI Analytics
- **Recharts Interactive Charts**: Bar Chart omzet 7 hari terakhir & Pie Chart distribusi metode pembayaran (CASH/QRIS/DEBIT).
- **Executive AI Sales Briefing**: Generasi otomatis laporan analisis omzet harian bertenaga AI dengan exporter format Markdown.
- **Raw Material Inventory Manager**: Monitoring stok bahan baku & peringatan stok menipis (*Low Stock Warning*).
- **Visual Table Floor Map Editor**: Denah tata letak meja resto interaktif & generator Standee QR Code meja siap cetak.
- **Transaction CSV Exporter**: Export laporan transaksi dalam format file CSV RFC-4180 kompatibel dengan Excel & Google Sheets.
- **Server-Sent Events (SSE) Stream**: Sync data pesanan real-time tanpa delay via `/api/orders/stream`.

---

## 4. Technical Stack & KPIs
- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Bun Runtime.
- **Database**: PostgreSQL (Neon Serverless) dengan fallback mode in-memory zero-crash.
- **Visualisasi**: Recharts 3.x, Lucide Icons, Tailwind CSS v4 Glassmorphism.
- **Kompilasi Build**: 0 Errors & 0 Warnings pada `bun run build`.
