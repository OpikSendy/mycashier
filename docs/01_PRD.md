# Product Requirement Document (PRD) — MyCashier POS & Table Self-Ordering PWA

## 1. Executive Summary
**MyCashier** adalah platform Aplikasi Kasir Online (Point of Sale / POS) dan System Pemesanan Mandiri dari Meja (Table QR Self-Ordering System) berbasis PWA & Progressive Web Application terpadu. Platform ini dirancang untuk usaha F&B (Restoran, Kafe, Kopi Shop, & Warung Modern) guna mempercepat alur pemesanan, mengurangi antrean, serta memberikan analitik penjualan berbasis AI secara real-time.

## 2. Target Users & User Roles
1. **Pelanggan (Customer / Table Guest)**: Scan QR Meja / Pilih Meja -> Lihat Menu -> Kustomisasi Pesanan -> Submit Pesanan Meja.
2. **Kasir (Cashier POS Operator)**: Kelola antrean pesanan meja, input pesanan kasir cepat (*walk-in*), proses pembayaran (Tunai, QRIS, Transfer), & cetak struk digital.
3. **Dapur (Kitchen Display System / KDS Operator)**: Melihat antrean tiket masakan secara real-time dengan indikator waktu dan status (`Menunggu` -> `Dimasak` -> `Siap Diantar` -> `Selesai`).
4. **Manajer / Pemilik Resto (Manager CMS & Analytics)**: Manajemen menu & stok (*CRUD*), laporan omzet harian/mingguan, dan konsultasi strategi bisnis via **Ask MyCashier AI**.

## 3. Core Features & Functional Requirements
- **Interactive Multi-View Switcher**: Navigasi mulus antar mode (*Customer Table View*, *Cashier POS*, *Kitchen KDS*, *Manager Dashboard*).
- **Table Self-Ordering Flow**:
  - Pilihan nomor meja (Meja 01 s/d Meja 12).
  - Filter kategori menu (Makanan Utama, Minuman, Dessert, Snacking).
  - Kustomisasi catatan pesanan (misal: "Tanpa Gula", "Pedas Manis").
  - Keranjang belanja real-time & ringkasan subtotal + pajak (10%).
- **Cashier POS Station**:
  - Live order feed dari meja pelanggan.
  - POS kasir cepat untuk pelanggan walk-in.
  - Simulasi pembayaran QRIS / Tunai & pencetakan struk digital.
- **Kitchen Display System (KDS)**:
  - Live order tickets board.
  - 1-click status update (`Dimasak`, `Siap Diantar`).
- **Manager CMS & AI Analytics**:
  - Grafik omzet & statistik produk terlaris.
  - Manajemen stok & harga produk.
  - Asisten AI cerdas (**Ask MyCashier AI**) via OpenRouter API.

## 4. Key Performance Indicators (KPIs)
- **Kompilasi Build**: 0 Errors pada Next.js 16 App Router Turbopack.
- **Responsivitas**: PWA Mobile-first & Desktop POS UI.
- **Transisi Tema**: Dark/Light mode & bilingual ID/EN.
